const express = require("express");
const Question = require("../models/Question");
const router = express.Router();

// Lấy tất cả câu hỏi
router.get("/", async (req, res) => {
  try {
    const questions = await Question.find().lean();
    res.json(questions);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách câu hỏi:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// Thêm một hoặc nhiều câu hỏi
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return res
        .status(400)
        .json({ message: "Dữ liệu không hợp lệ hoặc rỗng!" });
    }

    let questionsToInsert = [];

    if (Array.isArray(data)) {
      questionsToInsert = data.map((q) => {
        if (!q.text || !Array.isArray(q.options)) {
          throw new Error("Một hoặc nhiều câu hỏi không hợp lệ!");
        }
        return new Question(q);
      });
    } else {
      if (!data.text || !Array.isArray(data.options)) {
        return res
          .status(400)
          .json({ message: "Dữ liệu câu hỏi không hợp lệ!" });
      }
      questionsToInsert.push(new Question(data));
    }

    const savedQuestions = await Question.insertMany(questionsToInsert);
    res.status(201).json(savedQuestions);
  } catch (err) {
    console.error("Lỗi khi thêm câu hỏi:", err);
    res.status(400).json({ message: err.message || "Lỗi khi lưu câu hỏi!" });
  }
});

// Cập nhật một câu hỏi
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!updateData || !updateData.text || !Array.isArray(updateData.options)) {
      return res
        .status(400)
        .json({ message: "Dữ liệu cập nhật không hợp lệ!" });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Câu hỏi không tồn tại!" });
    }

    res.json(updatedQuestion);
  } catch (err) {
    console.error("Lỗi khi cập nhật câu hỏi:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// Xóa một câu hỏi
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedQuestion = await Question.findByIdAndDelete(id);

    if (!deletedQuestion) {
      return res.status(404).json({ message: "Câu hỏi không tồn tại!" });
    }

    res.json({ message: "Câu hỏi đã được xóa thành công!" });
  } catch (err) {
    console.error("Lỗi khi xóa câu hỏi:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// Nhận câu trả lời từ người dùng
router.post("/submit", async (req, res) => {
  console.log("Request received:", req.body);
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res
        .status(400)
        .json({ message: "Danh sách câu trả lời không hợp lệ!" });
    }

    let skinScores = { dry: 0, oily: 0, sensitive: 0, aging: 0, acne: 0 };

    for (let answer of answers) {
      const { questionId, selectedOptionIndex } = answer;

      if (!questionId || selectedOptionIndex === undefined) {
        return res
          .status(400)
          .json({ message: "Dữ liệu câu trả lời không hợp lệ!" });
      }

      const question = await Question.findById(questionId).lean();
      if (!question) {
        return res
          .status(404)
          .json({ message: `Câu hỏi với ID ${questionId} không tồn tại!` });
      }

      const selectedOption = question.options[selectedOptionIndex];
      if (!selectedOption || !selectedOption.points) {
        return res.status(400).json({ message: "Lựa chọn không hợp lệ!" });
      }

      for (let skinType in selectedOption.points) {
        if (skinScores.hasOwnProperty(skinType)) {
          skinScores[skinType] += selectedOption.points[skinType];
        }
      }
    }

    let bestSkinType = Object.keys(skinScores).reduce((a, b) =>
      skinScores[a] > skinScores[b] ? a : b
    );

    res.json({
      message: "Bài kiểm tra hoàn thành!",
      scores: skinScores,
      bestMatch: bestSkinType,
    });
  } catch (err) {
    console.error("Lỗi khi xử lý bài kiểm tra:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

module.exports = router;
