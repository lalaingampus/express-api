const { Sequelize } = require('sequelize');
const { sequelize, Pengeluaran, Pemasukan, Hutang } = require('../models');

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.userId;
    const { selectedCategory, amount, selectedSumber, keterangan, selectedDebt, createdAt  } = req.body;
    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid amount. Provide number > 0.' });
    }

    // Jika kategori Debt, validasi hutang
    if (selectedCategory === 'Debt') {
      if (!selectedDebt) {
        await t.rollback();
        return res.status(400).json({ message: 'Debt category selected but no debt ID provided.' });
      }
      const hutang = await Hutang.findOne({ where: { id: selectedDebt, userId } });
      if (!hutang) {
        await t.rollback();
        return res.status(404).json({ message: 'Selected debt not found.' });
      }
      if (parsedAmount > (hutang.debtToPay || 0)) {
        await t.rollback();
        return res.status(400).json({ message: 'Amount exceeds remaining debt.' });
      }

      const newDebtValue = (hutang.debtToPay || 0) - parsedAmount;
      await hutang.update({
        debtToPay: newDebtValue,
        status: newDebtValue === 0 ? 'Lunas' : 'Belum Lunas',
        updatedAt: new Date(),
      }, { transaction: t });
    }

    // Ambil sumber saldo dari Pemasukan
    const sumber = await Pemasukan.findOne({ where: { id: selectedSumber, userId } });
    if (!sumber) {
      await t.rollback();
      return res.status(400).json({ message: 'Selected sumber not found.' });
    }

    const suamiBalance = sumber.suami || 0;
    const istriBalance = sumber.istri || 0;
    const unMarriedBalance = sumber.unMarried || 0;

    let update = {};
    if (suamiBalance >= parsedAmount) {
      update.suami = suamiBalance - parsedAmount;
    } else if (istriBalance >= parsedAmount) {
      update.istri = istriBalance - parsedAmount;
    } else if (unMarriedBalance >= parsedAmount) {
      update.unMarried = unMarriedBalance - parsedAmount;
    } 
    
    else {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient balance in either suami or istri or unmarried.' });
    }

    await sumber.update(update, { transaction: t });

    const payload = {
      selectedCategory,
      selectedSumber,
      amount: parsedAmount,
      keterangan: selectedCategory === 'Debt' ? '' : (keterangan || ''),
      userId,
      createdAt: createdAt ? new Date(createdAt) : new Date(), 
      ...(selectedCategory === 'Debt' && { selectedDebt }),
    };

    const created = await Pengeluaran.create(payload, { transaction: t });

    await t.commit();
    const finalSumber = await Pemasukan.findByPk(sumber.id);
    res.status(201).json({
      id: created.id,
      ...payload,
      newSuamiBalance: finalSumber.suami,
      newIstriBalance: finalSumber.istri,
      newUnMarriedBalance: finalSumber.unMarried,
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error creating pengeluaran', error: error.message });
  }
};

exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.userId;
    const id = req.params.id;
    const body = req.body;

    const peng = await Pengeluaran.findOne({ where: { id, userId } });
    if (!peng) {
      await t.rollback();
      return res.status(404).json({ message: 'Data pengeluaran not found' });
    }

    const sumber = await Pemasukan.findOne({ where: { id: peng.selectedSumber, userId } });
    if (!sumber) {
      await t.rollback();
      return res.status(404).json({ message: 'Data pemasukan (sumber) not found' });
    }

    // Kembalikan jumlah lama ke saldo
    const oldAmount = peng.amount;
    if (sumber.suami && sumber.suami !== 0) {
      await sumber.update({ suami: sumber.suami + oldAmount }, { transaction: t });
    } else if (sumber.istri && sumber.istri !== 0) {
      await sumber.update({ istri: sumber.istri + oldAmount }, { transaction: t });
    } else if (sumber.unMarried && sumber.unMarried !== 0) {
      await sumber.update({ unMarried: sumber.unMarried + oldAmount }, { transaction: t });
    }
    
    else {
      await t.rollback();
      return res.status(400).json({ message: 'Neither suami nor istri nor unmarried has a valid amount to update back' });
    }

    // Update pengeluaran amount/keterangan (dan opsi selectedSumber)
    const newAmount = body.amount !== undefined ? Number(body.amount) : oldAmount;
    if (isNaN(newAmount) || newAmount <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const newSumberId = body.selectedSumber ?? peng.selectedSumber;
    let targetSumber = sumber;
    if (newSumberId !== peng.selectedSumber) {
      targetSumber = await Pemasukan.findOne({ where: { id: newSumberId, userId } });
      if (!targetSumber) {
        await t.rollback();
        return res.status(404).json({ message: 'New sumber not found' });
      }
    }

    // Potong saldo di target sumber
    if ((targetSumber.suami || 0) >= newAmount) {
      await targetSumber.update({ suami: (targetSumber.suami || 0) - newAmount }, { transaction: t });
    } else if ((targetSumber.istri || 0) >= newAmount) {
      await targetSumber.update({ istri: (targetSumber.istri || 0) - newAmount }, { transaction: t });
    } else if ((targetSumber.unMarried || 0) >= newAmount) {
      await targetSumber.update({ unMarried: (targetSumber.unMarried || 0) - newAmount }, { transaction: t });
    }
    else {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient balance on new sumber' });
    }

    await peng.update({
      amount: newAmount,
      keterangan: body.keterangan ?? peng.keterangan,
      selectedSumber: newSumberId,
      updatedAt: new Date().toISOString(),
    }, { transaction: t });

    await t.commit();
    res.json({ message: 'Data pengeluaran updated successfully' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error updating pengeluaran', error: error.message });
  }
};

exports.destroy = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    const peng = await Pengeluaran.findOne({ where: { id, userId } });
    if (!peng) {
      await t.rollback();
      return res.status(404).json({ message: 'Data pengeluaran not found' });
    }

    const sumber = await Pemasukan.findOne({ where: { id: peng.selectedSumber, userId } });
    if (!sumber) {
      await t.rollback();
      return res.status(404).json({ message: 'Data pemasukan not found' });
    }

    // Kembalikan amount ke saldo (logika: prefer yang non-null / non-zero)
    if (sumber.suami !== null && sumber.suami !== 0) {
      await sumber.update({ suami: sumber.suami + peng.amount }, { transaction: t });
    } else if (sumber.istri !== null && sumber.istri !== 0) {
      await sumber.update({ istri: sumber.istri + peng.amount }, { transaction: t });
    }else if (sumber.unMarried !== null && sumber.unMarried !== 0) {
      await sumber.update({ unMarried: sumber.unMarried + peng.amount }, { transaction: t });
    }
    
    else {
      await t.rollback();
      return res.status(400).json({ message: 'Neither suami nor istri has valid amount to update' });
    }

    await peng.destroy({ transaction: t });
    await t.commit();
    res.json({ message: 'Data pengeluaran deleted successfully, and amount returned to selectedSumber' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error deleting pengeluaran', error: error.message });
  }
};

exports.list = async (req, res) => {
  try {
    const userId = req.user.userId;
    const rows = await Pengeluaran.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error getting pengeluaran', error: error.message });
  }
};

exports.listDebtCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const rows = await Pengeluaran.findAll({ where: { userId, selectedCategory: 'Debt' }, order: [['createdAt', 'DESC']] });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error getting pengeluaran', error: error.message });
  }
};

exports.listBySumberPerson = async (req, res) => {
  // util untuk: pengeluaran_list_istri / pengeluaran_list_suami (berdasar pemasukan dengan suami/istri == null di versi lama)
  try {
    const userId = req.user.userId;
    const role = req.params.role; // 'suami' | 'istri'

    // cari pemasukan id dengan pola lama:
    // istri list → cari pemasukan suami == null
    // suami list → cari pemasukan istri == null
    const isIstri = role === 'Husband';
    const wherePemasukan = isIstri
      ? { userId, suami: { [Sequelize.Op.is]: null } }
      : { userId, istri: { [Sequelize.Op.is]: null } };

    const pemasukan = await Pemasukan.findOne({ where: wherePemasukan });
    if (!pemasukan) return res.status(404).json({ message: `No pemasukan data found for ${role}` });

    const rows = await Pengeluaran.findAll({ where: { userId, selectedSumber: pemasukan.id } });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error getting pengeluaran', error: error.message });
  }
};
