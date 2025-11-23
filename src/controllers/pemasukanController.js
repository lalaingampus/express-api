const { Sequelize, Pemasukan } = require("../models");

exports.create = async (req, res) => {
  try {
    console.log("📥 Body:", req.body);
    console.log("👤 User from token:", req.user);

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID missing from token" });
    }

    const {
      selectedPerson,
      selectedItem,
      selectedCategory,
      selectedStatus,
      unMarried,
      suami,
      istri,
      total,
      keterangan,
      createdAt
    } = req.body;

    // ====== Numerik cleaner ======
    const suamiNumber =
      suami !== undefined && suami !== null && suami !== ""
        ? Number(suami)
        : null;

    const unMarriedNumber =
      unMarried !== undefined && unMarried !== null && unMarried !== ""
        ? Number(unMarried)
        : null;

    const istriNumber =
      istri !== undefined && istri !== null && istri !== ""
        ? Number(istri)
        : null;

    const totalNumber =
      total !== undefined && total !== null && total !== ""
        ? Number(total)
        : null;

    if (
      (suamiNumber !== null && isNaN(suamiNumber)) ||
      (istriNumber !== null && isNaN(istriNumber)) ||
      (unMarriedNumber !== null && isNaN(unMarriedNumber)) ||
      (totalNumber !== null && isNaN(totalNumber))
    ) {
      return res.status(400).json({ message: "Invalid numeric input" });
    }

    // ====== FIX: gunakan TANGGAL DARI USER ======
    const finalCreatedAt = createdAt ? new Date(createdAt) : new Date();

    const data = await Pemasukan.create({
      selectedCategory: selectedCategory || null,
      selectedPerson: selectedPerson || null,
      selectedItem: selectedItem || null,
      selectedStatus: selectedStatus || null,
      unMarried: unMarriedNumber || null,
      suami: suamiNumber,
      istri: istriNumber,
      total: totalNumber,
      keterangan: keterangan || "",
      userId,
      createdAt: finalCreatedAt,   // ⬅️ THIS IS THE FIX 🔥🔥
    });

    res.status(201).json(data);
  } catch (error) {
    console.error("❌ Error creating pemasukan:", error);
    res.status(500).json({
      message: "Error creating pemasukan",
      error: error.message,
    });
  }
};


// ===================================================================

exports.listByUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const list = await Pemasukan.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    const mapped = list.map((row) => {
      const d = row.toJSON();
      let amountToDisplay = null;
      if (d.suami === 0 && d.istri > 0) amountToDisplay = d.istri;
      else if (d.istri === 0 && d.suami > 0) amountToDisplay = d.suami;
      else if (d.suami > 0) amountToDisplay = d.suami;
      else if (d.istri > 0) amountToDisplay = d.istri;
      else if (d.unMarried > 0) amountToDisplay = d.unMarried;
        return {
          id: d.id,
          selectedCategory: d.selectedCategory,
          selectedPerson: d.selectedPerson,
          selectedItem: d.selectedItem,
          selectedStatus: d.selectedStatus,
          unMarried : d.unMarried,
          suami: d.suami,
          istri: d.istri,
          total: d.total,
          keterangan: d.keterangan,
          amountToDisplay,
          createdAt: d.createdAt,
        };
    });

    res.json(mapped);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching pemasukan", error: error.message });
  }
};

// ===================================================================

exports.getById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    const row = await Pemasukan.findOne({ where: { id, userId } });
    if (!row)
      return res
        .status(404)
        .json({ message: "Data not found or unauthorized access" });

    const d = row.toJSON();
    let amountToDisplay = null;
    if (d.suami === 0 && d.istri > 0) amountToDisplay = d.istri;
    else if (d.istri === 0 && d.suami > 0) amountToDisplay = d.suami;
    else if (d.suami > 0) amountToDisplay = d.suami;
    else if (d.istri > 0) amountToDisplay = d.istri;
    else if (d.unMarried > 0) amountToDisplay = d.unMarried;

    res.json({
      id: d.id,
      selectedCategory: d.selectedCategory,
      selectedPerson: d.selectedPerson,
      selectedItem: d.selectedItem,
      selectedStatus: d.selectedStatus,
      unMarried: d.unMarried,
      suami: d.suami,
      istri: d.istri,
      total: d.total,
      keterangan: d.keterangan,
      amountToDisplay,
      createdAt: d.createdAt,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching pemasukan", error: error.message });
  }
};

// ===================================================================

exports.update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;
    const data = await Pemasukan.findOne({ where: { id, userId } });
    if (!data)
      return res.status(404).json({ message: "Data pemasukan not found" });

    const body = req.body;
    const newSuami =
      body.suami !== undefined && body.suami !== ""
        ? Number(body.suami)
        : data.suami;
    const newIstri =
      body.istri !== undefined && body.istri !== ""
        ? Number(body.istri)
        : data.istri;
    const newTotal =
      body.total !== undefined && body.total !== ""
        ? Number(body.total)
        : data.total;
    const newUnMarried =
      body.unMarried !== undefined && body.unMarried !== ""
        ? Number(body.unMarried)
        : data.unMarried;

    await data.update({
      ...data.toJSON(),
      suami: newSuami,
      istri: newIstri,
      unMarried: newUnMarried,
      total: newTotal,
      keterangan: body.keterangan ?? data.keterangan,
      updatedAt: new Date(),
    });

    res.json({
      message: "Data pemasukan updated successfully",
      updatedData: data,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating pemasukan", error: error.message });
  }
};

// ===================================================================

exports.destroy = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    const row = await Pemasukan.findOne({ where: { id, userId } });
    if (!row)
      return res.status(404).json({ message: "Data pemasukan not found" });

    await row.destroy();
    res.json({ message: "Data pemasukan deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting pemasukan", error: error.message });
  }
};

// ===================================================================

exports.listSuami = async (req, res) => {
  try {
    const userId = req.user.userId;
    const rows = await Pemasukan.findAll({
      where: { userId, selectedPerson: "Suami" },
    });
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting pemasukan", error: error.message });
  }
};

exports.listIstri = async (req, res) => {
  try {
    const userId = req.user.userId;
    const rows = await Pemasukan.findAll({
      where: { userId, selectedPerson: "Istri" },
    });
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting pemasukan", error: error.message });
  }
};
