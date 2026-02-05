class PromptBuilder {
  constructor(queryParams) {
    this.params = queryParams;
    this.modifications = [];
  }

  /**
   * Build complete prompt for dental image modification
   * @returns {string} Formatted prompt for AI
   */
  build() {
    const arch = this.getArch();
    const teethCount = this.getTeethCount();

    // NEW: Determine tooth preservation mode first as it affects other modifications
    const preservationMode = this.getPreservationMode();

    this.addBrighteningModification();
    this.addWidenModification();
    this.addSpacingModification();
    this.addAlignmentModification();
    this.addMissingTeethModification();
    this.addGummySmileModification();
    this.addIncisorShapeModification(preservationMode); // Pass preservation mode
    this.addToothShapeModification(preservationMode); // Pass preservation mode
    this.addCharacterisationModification();
    this.addGumRecessionModification();
    this.addBiteCorrection();

    // NEW: Add preservation constraints based on mode
    this.addPreservationConstraints(preservationMode);

    const prompt = this.constructPrompt(arch, teethCount);
    console.log("params", this.params);
    console.log("modifications", this.modifications);

    return prompt;
  }

  getArch() {
    const arch = (this.params.arch || "upper").toLowerCase();
    if (!["upper", "lower", "both"].includes(arch)) {
      return "upper";
    }
    return arch;
  }

  getTeethCount() {
    const count = this.params.teeth_count || this.params.number_of_teeth || "6";

    if (count === "full" || count === "full_arch") {
      return "full arch";
    }

    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount < 2 || numCount > 10) {
      return "6";
    }

    return numCount.toString();
  }

  // NEW: Get tooth preservation mode
  getPreservationMode() {
    const mode = (this.params.tooth_preservation_mode || "complete").toLowerCase();
    const validModes = ["complete", "edges_only", "custom"];
    return validModes.includes(mode) ? mode : "complete";
  }

  addBrighteningModification() {
    const brighten = (this.params.brighten || "").toLowerCase();

    const brightenMap = {
      subtle:
        "Apply subtle brightening to achieve a natural white shade (1-2 shades lighter)",
      natural: "Brighten to a healthy natural white shade (2-3 shades lighter)",
      super_natural:
        "Preserve the patient's current tooth shade exactly; do NOT alter natural hue or lightness; maintain existing variations",
    };

    if (brightenMap[brighten]) {
      this.modifications.push(brightenMap[brighten]);
    }
  }

  addCharacterisationModification() {
    const addChar =
      this.params.add_characterisation === "true" ||
      this.params.add_characterisation === true;

    if (addChar) {
      this.modifications.push(
        "Add subtle characterization effects: natural specular reflections, enamel opalescence, and controlled chroma variation to enhance realism"
      );
    }
  }

  // UPDATED: Add tooth shape modification based on preservation mode
  addToothShapeModification(preservationMode) {
    // If complete preservation, do not add any tooth shape modifications
    if (preservationMode === "complete") {
      return;
    }

    // If edge contouring only, add specific instruction
    if (preservationMode === "edges_only") {
      this.modifications.push(
        "ONLY perform edge contouring: smooth and refine incisal edges while maintaining the original facial aspects and overall tooth shapes"
      );
      return;
    }

    // Only for custom mode, apply the selected tooth shape
    const shape = (this.params.tooth_shape || "maintain").toLowerCase();
    const shapeMap = {
      maintain: "Maintain baseline tooth form without reshaping",
      square:
        "Modify baseline tooth forms toward square contours (more masculine): emphasize flat incisal edges and slightly broader proximal contacts",
      oval:
        "Modify baseline tooth forms toward oval contours (more feminine): soften incisal edges and round contours",
      squoval:
        "Modify baseline tooth forms to 'squoval' — balanced combination of square and oval features for a natural, modern look",
    };

    if (shapeMap[shape]) {
      this.modifications.push(shapeMap[shape]);
    }
  }

  addWidenModification() {
    const widenUpper = this.params.widen_upper_teeth === "true";
    const widenLower = this.params.widen_lower_teeth === "true";

    if (widenUpper) {
      this.modifications.push(
        "Increase the width of upper teeth by 10-15% to create fuller appearance"
      );
    }
    if (widenLower) {
      this.modifications.push(
        "Increase the width of lower teeth by 10-15% proportionally"
      );
    }
  }

  addSpacingModification() {
    const closeSpaces = this.params.close_spaces_evenly === "true";

    if (closeSpaces) {
      this.modifications.push(
        "Eliminate gaps by redistributing teeth spacing evenly while maintaining natural contact points"
      );
    }
  }

  addAlignmentModification() {
    const crowding = (
      this.params.correct_crowding_with_alignment || ""
    ).toLowerCase();

    const crowdingMap = {
      mild: "Straighten mildly crowded teeth by adjusting rotation up to 5-10 degrees",
      moderate:
        "Correct moderate crowding by aligning teeth with adjustments up to 15-20 degrees",
      severe:
        "Significantly correct severe crowding with alignment adjustments up to 25-30 degrees",
    };

    if (crowdingMap[crowding]) {
      this.modifications.push(crowdingMap[crowding]);
    }
  }

  addMissingTeethModification() {
    const replaceMissing = this.params.replace_missing_teeth === "true";

    if (replaceMissing) {
      this.modifications.push(
        "Fill any visible gaps from missing teeth with anatomically correct replacement teeth matching adjacent tooth morphology"
      );
    }
  }

  // UPDATED: Add gummy smile modification with severity levels
  addGummySmileModification() {
    const reduceGummy = this.params.reduce_gummy_smile === "true";
    const severity = (this.params.gummy_smile_severity || "mild").toLowerCase();

    if (reduceGummy) {
      const severityMap = {
        mild: "Reduce visible gum tissue by 2-3mm",
        moderate: "Reduce visible gum tissue by 4-5mm",
        severe: "Reduce visible gum tissue by 6mm or more"
      };

      const liftAmount = severityMap[severity] || severityMap.mild;
      this.modifications.push(
        `${liftAmount} to achieve ideal 1-3mm gum display when smiling. IMPORTANT: Preserve all tooth shapes and facial aspects while adjusting gums only.`
      );
    }
  }

  // UPDATED: Add incisor shape modification with mode
  addIncisorShapeModification(preservationMode) {
    const improveShape = this.params.improve_incisor_shape === "true";
    const mode = (this.params.incisor_improvement_mode || "contouring").toLowerCase();

    if (improveShape) {
      if (mode === "contouring") {
        this.modifications.push(
          "ONLY perform edge contouring on incisors: smooth and refine incisal edges to create natural contours. DO NOT reshape the overall tooth form."
        );
      } else if (mode === "reshape") {
        this.modifications.push(
          "Redesign incisor shapes completely: create optimal proportions and contours while maintaining natural aesthetics"
        );
      }
    }
  }

  addGumRecessionModification() {
    const improveRecession = this.params.improve_gum_recession === "true";

    if (improveRecession) {
      this.modifications.push(
        "Restore gum tissue coverage to the cemento-enamel junction, eliminating exposed roots"
      );
    }
  }

  addBiteCorrection() {
    const correctUnderbite = this.params.correct_underbite === "true";
    const correctOverbite = this.params.correct_overbite === "true";

    if (correctUnderbite) {
      this.modifications.push(
        "Reposition lower jaw posteriorly to achieve proper overbite relationship (upper teeth 2-3mm in front of lower)"
      );
    }
    if (correctOverbite) {
      this.modifications.push(
        "Reduce excessive overbite by adjusting upper anterior teeth vertical overlap to ideal 2-3mm"
      );
    }
  }

  // NEW: Add preservation constraints based on mode
  addPreservationConstraints(preservationMode) {
    if (preservationMode === "complete") {
      this.modifications.push(
        "CRITICAL CONSTRAINT: DO NOT modify any tooth shapes, facial aspects, or contours. Only perform gum modifications if specified. Preserve all existing tooth characteristics."
      );
    } else if (preservationMode === "edges_only") {
      this.modifications.push(
        "CRITICAL CONSTRAINT: ONLY perform edge contouring. Maintain all facial aspects and overall tooth shapes. Do not reshape or alter the facial surfaces of teeth."
      );
    }
  }

  /**
   * Construct enhanced prompt with strict constraints
   */
  constructPrompt(arch, teethCount) {
    const archText =
      arch === "both" ? "both upper and lower arches" : `${arch} arch`;

    // Start with clear role and constraints
    let prompt = `ROLE: You are an expert dental image manipulation AI specialized in cosmetic dentistry visualization.

STRICT MODIFICATION ZONE:
- Target area: ${archText} ONLY
- ${arch === "upper" ? "DO NOT modify the lower arch in any way" : ""}
- ${arch === "lower" ? "DO NOT modify the upper arch in any way" : ""}
- ${arch === "both" ? "Modify both upper and lower arches as specified" : ""}
- Number of teeth to modify: ${teethCount} ${teethCount === "full arch"
        ? ""
        : `(counting from the central midline outward)`
      }
- Leave all other teeth completely unchanged

`;

    if (this.modifications.length > 0) {
      prompt += `REQUIRED MODIFICATIONS (apply in this exact order):\n`;
      this.modifications.forEach((mod, index) => {
        prompt += `${index + 1}. ${mod}\n`;
      });
      prompt += "\n";
    } else {
      prompt += `Apply conservative cosmetic improvements for a natural, healthy smile.\n\n`;
    }

    // Add explicit constraints
    prompt += `QUALITY CONSTRAINTS:
- Maintain photorealistic quality with natural lighting and texture
- Preserve original tooth anatomy and proportions within normal variation
- Ensure modifications are clinically achievable with modern dentistry
- Keep gum tissue, lips, and facial features completely unchanged unless specified for gum work
- Blend all edits seamlessly with no visible artifacts or discontinuities
- Result must look like a professional before/after from an actual dental practice

VERIFICATION CHECKLIST:
✓ Modified ONLY the ${archText} as specified
✓ Left the ${arch === "upper" ? "lower" : arch === "lower" ? "upper" : "non-target"
      } teeth unmodified
✓ Applied all ${this.modifications.length} modifications correctly
✓ Maintained natural dental aesthetics throughout
✓ Result appears professionally achievable

OUTPUT: Return the modified image maintaining original resolution and quality.`;

    return prompt;
  }

  /**
   * Validate if query parameters are valid
   * UPDATED: Added validation for new parameters
   */
  static validate(queryParams) {
    const errors = [];

    // Existing validation for arch
    if (queryParams.arch) {
      const validArchs = ["upper", "lower", "both"];
      if (!validArchs.includes(queryParams.arch.toLowerCase())) {
        errors.push("Invalid arch value. Must be: upper, lower, or both");
      }
    }

    // Existing validation for teeth_count
    if (queryParams.teeth_count || queryParams.number_of_teeth) {
      const count = queryParams.teeth_count || queryParams.number_of_teeth;
      if (count !== "full" && count !== "full_arch") {
        const numCount = parseInt(count);
        if (isNaN(numCount) || numCount < 2 || numCount > 10) {
          errors.push('Invalid teeth count. Must be between 2-10 or "full"');
        }
      }
    }

    // Existing validation for brighten
    if (queryParams.brighten) {
      const validLevels = ["subtle", "natural", "super_natural"];
      if (!validLevels.includes(queryParams.brighten.toLowerCase())) {
        errors.push(
          "Invalid brighten value. Must be: subtle, natural, or super_natural"
        );
      }
    }

    // Existing validation for tooth_shape
    if (queryParams.tooth_shape) {
      const validShapes = ["maintain_existing","maintain", "square", "oval", "squoval"];
      if (!validShapes.includes(queryParams.tooth_shape.toLowerCase())) {
        errors.push(
          "Invalid tooth_shape value. Must be: maintain, square, oval, or squoval"
        );
      }
    }

    // NEW: Validation for tooth_preservation_mode
    if (queryParams.tooth_preservation_mode) {
      const validModes = ["complete", "edges_only", "custom"];
      if (!validModes.includes(queryParams.tooth_preservation_mode.toLowerCase())) {
        errors.push(
          "Invalid tooth_preservation_mode value. Must be: complete, edges_only, or custom"
        );
      }
    }

    // NEW: Validation for gummy_smile_severity
    if (queryParams.gummy_smile_severity) {
      const validSeverities = ["mild", "moderate", "severe"];
      if (!validSeverities.includes(queryParams.gummy_smile_severity.toLowerCase())) {
        errors.push(
          "Invalid gummy_smile_severity value. Must be: mild, moderate, or severe"
        );
      }
    }

    // NEW: Validation for incisor_improvement_mode
    if (queryParams.incisor_improvement_mode) {
      const validModes = ["contouring", "reshape"];
      if (!validModes.includes(queryParams.incisor_improvement_mode.toLowerCase())) {
        errors.push(
          "Invalid incisor_improvement_mode value. Must be: contouring or reshape"
        );
      }
    }

    // Existing validation for crowding
    if (queryParams.correct_crowding_with_alignment) {
      const validLevels = ["mild", "moderate", "severe"];
      if (
        !validLevels.includes(
          queryParams.correct_crowding_with_alignment.toLowerCase()
        )
      ) {
        errors.push(
          "Invalid crowding value. Must be: mild, moderate, or severe"
        );
      }
    }

    // Updated boolean parameters list with new ones
    const booleanParams = [
      "widen_upper_teeth",
      "widen_lower_teeth",
      "close_spaces_evenly",
      "replace_missing_teeth",
      "reduce_gummy_smile", // Now used with severity
      "improve_incisor_shape", // NEW: Changed from improve_shape_of_incisal_edges
      "improve_gum_recession",
      "correct_underbite",
      "correct_overbite",
      "add_characterisation",
      // Note: preserve_facial_aspect is handled differently in frontend
    ];

    booleanParams.forEach((param) => {
      if (queryParams[param] !== undefined) {
        const value = queryParams[param].toLowerCase();
        if (value !== "true" && value !== "false") {
          errors.push(`Invalid ${param} value. Must be: true or false`);
        }
      }
    });

    // Backward compatibility: Also check old parameter name
    if (queryParams.improve_shape_of_incisal_edges !== undefined) {
      const value = queryParams.improve_shape_of_incisal_edges.toLowerCase();
      if (value !== "true" && value !== "false") {
        errors.push("Invalid improve_shape_of_incisal_edges value. Must be: true or false");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = PromptBuilder;