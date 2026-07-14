import {
  createSynonymGroup,
  updateSynonymGroup,
  deleteSynonymGroup,
  getAllSynonymGroups,
  getSynonymGroupById,
  toggleSynonymGroup,
  bulkImportSynonyms,
} from "../services/searchSynonym.service.js";
import {
  createStopWord,
  updateStopWord,
  deleteStopWord,
  getAllStopWords,
  getStopWordById,
  toggleStopWord,
  bulkImportStopWords,
} from "../services/searchStopWord.service.js";
import {
  createSetting,
  updateSetting,
  updateSettingById,
  deleteSetting,
  getAllSettings,
  getSettingsByCategory,
  getSettingById,
  toggleSetting,
  bulkUpsertSettings,
  initializeDefaultSettings,
} from "../services/searchSettings.service.js";

// ═══════════════════════════════════════════════════════════════════
// Synonym Management Controllers
// ═══════════════════════════════════════════════════════════════════

export async function createSynonymController(req, res) {
  try {
    const { group, terms, language, category, priority } = req.body;
    const createdBy = req.userId || null;

    const result = await createSynonymGroup({
      group,
      terms,
      language,
      category,
      priority,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Synonym group created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create synonym group",
    });
  }
}

export async function updateSynonymController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await updateSynonymGroup(id, data);

    return res.status(200).json({
      success: true,
      message: "Synonym group updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update synonym group",
    });
  }
}

export async function deleteSynonymController(req, res) {
  try {
    const { id } = req.params;

    const result = await deleteSynonymGroup(id);

    return res.status(200).json({
      success: true,
      message: "Synonym group deleted successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete synonym group",
    });
  }
}

export async function getAllSynonymsController(req, res) {
  try {
    const { language, category } = req.query;

    const result = await getAllSynonymGroups({ language, category });

    return res.status(200).json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch synonym groups",
    });
  }
}

export async function getSynonymByIdController(req, res) {
  try {
    const { id } = req.params;

    const result = await getSynonymGroupById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Synonym group not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch synonym group",
    });
  }
}

export async function toggleSynonymController(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await toggleSynonymGroup(id, isActive);

    return res.status(200).json({
      success: true,
      message: `Synonym group ${isActive ? "activated" : "deactivated"} successfully`,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to toggle synonym group",
    });
  }
}

export async function bulkImportSynonymsController(req, res) {
  try {
    const { synonyms } = req.body;

    if (!Array.isArray(synonyms) || synonyms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "synonyms array is required",
      });
    }

    const result = await bulkImportSynonyms(synonyms);

    return res.status(201).json({
      success: true,
      message: `${result.length} synonym groups imported successfully`,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to import synonyms",
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// Stop Word Management Controllers
// ═══════════════════════════════════════════════════════════════════

export async function createStopWordController(req, res) {
  try {
    const { word, language } = req.body;
    const createdBy = req.userId || null;

    const result = await createStopWord({ word, language, createdBy });

    return res.status(201).json({
      success: true,
      message: "Stop word created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create stop word",
    });
  }
}

export async function updateStopWordController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await updateStopWord(id, data);

    return res.status(200).json({
      success: true,
      message: "Stop word updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update stop word",
    });
  }
}

export async function deleteStopWordController(req, res) {
  try {
    const { id } = req.params;

    const result = await deleteStopWord(id);

    return res.status(200).json({
      success: true,
      message: "Stop word deleted successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete stop word",
    });
  }
}

export async function getAllStopWordsController(req, res) {
  try {
    const { language } = req.query;

    const result = await getAllStopWords({ language });

    return res.status(200).json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch stop words",
    });
  }
}

export async function getStopWordByIdController(req, res) {
  try {
    const { id } = req.params;

    const result = await getStopWordById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Stop word not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch stop word",
    });
  }
}

export async function toggleStopWordController(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await toggleStopWord(id, isActive);

    return res.status(200).json({
      success: true,
      message: `Stop word ${isActive ? "activated" : "deactivated"} successfully`,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to toggle stop word",
    });
  }
}

export async function bulkImportStopWordsController(req, res) {
  try {
    const { words } = req.body;

    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        success: false,
        message: "words array is required",
      });
    }

    const result = await bulkImportStopWords(words);

    return res.status(201).json({
      success: true,
      message: `${result.length} stop words imported successfully`,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to import stop words",
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// Search Settings Management Controllers
// ═══════════════════════════════════════════════════════════════════

export async function createSettingController(req, res) {
  try {
    const { key, value, type, category, description } = req.body;
    const updatedBy = req.userId || null;

    const result = await createSetting({
      key,
      value,
      type,
      category,
      description,
      updatedBy,
    });

    return res.status(201).json({
      success: true,
      message: "Setting created successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create setting",
    });
  }
}

export async function updateSettingController(req, res) {
  try {
    const { key } = req.params;
    const data = req.body;
    data.updatedBy = req.userId || null;

    const result = await updateSetting(key, data);

    return res.status(200).json({
      success: true,
      message: "Setting updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update setting",
    });
  }
}

export async function updateSettingByIdController(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    data.updatedBy = req.userId || null;

    const result = await updateSettingById(id, data);

    return res.status(200).json({
      success: true,
      message: "Setting updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update setting",
    });
  }
}

export async function deleteSettingController(req, res) {
  try {
    const { id } = req.params;

    const result = await deleteSetting(id);

    return res.status(200).json({
      success: true,
      message: "Setting deleted successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete setting",
    });
  }
}

export async function getAllSettingsController(req, res) {
  try {
    const { category } = req.query;

    const result = await getAllSettings({ category });

    return res.status(200).json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch settings",
    });
  }
}

export async function getSettingsByCategoryController(req, res) {
  try {
    const { category } = req.params;

    const result = await getSettingsByCategory(category);

    return res.status(200).json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch settings by category",
    });
  }
}

export async function getSettingByIdController(req, res) {
  try {
    const { id } = req.params;

    const result = await getSettingById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch setting",
    });
  }
}

export async function toggleSettingController(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await toggleSetting(id, isActive);

    return res.status(200).json({
      success: true,
      message: `Setting ${isActive ? "activated" : "deactivated"} successfully`,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to toggle setting",
    });
  }
}

export async function bulkUpsertSettingsController(req, res) {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "settings array is required",
      });
    }

    const result = await bulkUpsertSettings(settings);

    return res.status(200).json({
      success: true,
      message: "Settings upserted successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to upsert settings",
    });
  }
}

export async function initializeDefaultSettingsController(req, res) {
  try {
    const result = await initializeDefaultSettings();

    return res.status(200).json({
      success: true,
      message: "Default settings initialized successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to initialize default settings",
    });
  }
}

export default {
  // Synonym controllers
  createSynonymController,
  updateSynonymController,
  deleteSynonymController,
  getAllSynonymsController,
  getSynonymByIdController,
  toggleSynonymController,
  bulkImportSynonymsController,

  // Stop word controllers
  createStopWordController,
  updateStopWordController,
  deleteStopWordController,
  getAllStopWordsController,
  getStopWordByIdController,
  toggleStopWordController,
  bulkImportStopWordsController,

  // Settings controllers
  createSettingController,
  updateSettingController,
  updateSettingByIdController,
  deleteSettingController,
  getAllSettingsController,
  getSettingsByCategoryController,
  getSettingByIdController,
  toggleSettingController,
  bulkUpsertSettingsController,
  initializeDefaultSettingsController,
};
