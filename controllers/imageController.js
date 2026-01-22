// controllers/imageController.js
const { OpenAI } = require("openai");
const PromptBuilder = require("../services/promptBuilder");
const optimizeDentalImage = require("../utils/imageOptimizer");
const {File}= require("node:buffer")
class ImageController {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Main handler for dental image creation
   */

  async createImage(req, res, next) {
    try {
      // 1. Validate file exists
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image provided",
        });
      }

      // 2. Validate query parameters
      // console.log("file got", req.file);

      const validation = PromptBuilder.validate(req.query);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: "Invalid parameters",
          details: validation.errors,
        });
      }

      let params;
      if (Object.keys(req.body).length !== 0) params = req.body;
      if (Object.keys(req.query).length !== 0) params = req.query;

      const promptBuilder = new PromptBuilder(params);
      const prompt = promptBuilder.build();

      console.log("Generated Prompt:", prompt);

      // 4. Convert image to base64
      const optimizeDentalImageBuffer = await optimizeDentalImage(
        req.file.buffer
      );

      // 5. Call OpenAI API
      const response = await this.callOpenAI(prompt, optimizeDentalImageBuffer);

      // 6. Return success response
      return res.json({
        success: true,
        data: {
          generatedImageUrl: response.imageUrl,
          description: response.description,
          prompt: prompt,
          modifications: promptBuilder.modifications,
        },
      });
    } catch (error) {
      // Pass to error handler middleware
      next(error);
    }
  }

  /**
   * Call OpenAI API for image generation/modification
   */
  async callOpenAI(prompt, imageBuffer) {
    try {
      // console.log("image", imageBuffer);
      const imageFile = new File([imageBuffer], "input.jpg", {
        type: "image/jpeg",
      });
      // console.log("image file", imageFile);
      
      const response = await this.openai.images.edit({
        model: "gpt-image-1.5",
        prompt: prompt,
        image: imageFile, // <— main input image
        // mask: optionalMaskBuffer,      // <— only if doing cutout edits
      });

      // extract base64 PNG
      const b64 = response.data[0].b64_json;
      // console.log("response of ai: ", response);
      console.log("Got response from ai.",{
        image:"bs64 string",
        size:response?.size,
        quality:response?.quality,
        output_format:response?.output_format,
        usage:response?.usage
      });

      // convert base64 into browser-usable data URL
      const imageData = `data:image/png;base64,${b64}`;
      // console.log("image data", imageData.slice(20));

      // const description = visionResponse.choices[0].message.content;
      const description = "testing local";
      // const imageUrl=
      //     "https://images.pexels.com/photos/20620210/pexels-photo-20620210.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
       
      return {
        description: description,
        imageUrl: imageData,
      };
    } catch (error) {
      // Handle OpenAI-specific errors
      this.handleOpenAIError(error);
    }
  }

  /**
   * Handle OpenAI API errors with detailed messages
   */
  handleOpenAIError(error) {
    console.error("OpenAI API Error:", error);

    // API Key errors
    if (error.status === 401) {
      const err = new Error("Invalid or missing OpenAI API key");
      err.status = 500;
      err.code = "INVALID_API_KEY";
      throw err;
    }

    // Rate limit errors
    if (error.status === 429) {
      const err = new Error(
        "OpenAI API rate limit exceeded. Please try again later."
      );
      err.status = 429;
      err.code = "RATE_LIMIT_EXCEEDED";
      throw err;
    }

    // Insufficient quota
    if (error.code === "insufficient_quota") {
      const err = new Error(
        "OpenAI API quota exceeded. Please check your billing."
      );
      err.status = 402;
      err.code = "INSUFFICIENT_QUOTA";
      throw err;
    }

    // Content policy violations
    if (error.code === "content_policy_violation") {
      const err = new Error("Image violates OpenAI content policy");
      err.status = 400;
      err.code = "CONTENT_POLICY_VIOLATION";
      throw err;
    }

    // Server errors
    if (error.status >= 500) {
      const err = new Error("OpenAI service temporarily unavailable");
      err.status = 503;
      err.code = "SERVICE_UNAVAILABLE";
      throw err;
    }

    // Generic OpenAI error
    const err = new Error(error.message || "Failed to process image with AI");
    err.status = 500;
    err.code = "AI_PROCESSING_ERROR";
    err.originalError = error;
    throw err;
  }
}

module.exports = new ImageController();
