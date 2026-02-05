const API_URL = "https://nodejs-ai-3591.vercel.app/"; // Change this to your backend URL

// State - UPDATED with new options
let state = {
  imageFile: null,
  selectedOptions: {
    arch: "upper",
    teeth_count: "6",
    brighten: null,
    correct_crowding_with_alignment: null,
    tooth_shape: "maintain_existing",
    tooth_preservation_mode: "complete", // NEW: complete, edges_only, custom
    gummy_smile_severity: null, // NEW: mild, moderate, severe
    incisor_improvement_mode: "contouring", // NEW: contouring, reshape
    widen_upper_teeth: false,
    widen_lower_teeth: false,
    close_spaces_evenly: false,
    replace_missing_teeth: false,
    reduce_gummy_smile: false,
    improve_incisor_shape: false, // CHANGED: from improve_shape_of_incisal_edges
    improve_gum_recession: false,
    correct_underbite: false,
    correct_overbite: false,
    add_characterisation: false,
    preserve_facial_aspect: true, // NEW
  },
  results: null,
};

// DOM Elements - UPDATED with new elements
const elements = {
  uploadArea: document.getElementById("upload-area"),
  uploadButton: document.getElementById("browse-btn"),
  imageInput: document.getElementById("image-input"),
  imagePreview: document.getElementById("image-preview"),
  previewImg: document.getElementById("preview-img"),
  removeImage: document.getElementById("remove-image"),
  imageSize: document.getElementById("image-size"),
  generateBtn: document.getElementById("generate-btn"),
  processingIndicator: document.getElementById("processing-indicator"),
  progressBar: document.getElementById("progress-bar"),
  progressText: document.getElementById("progress-text"),
  resultsSection: document.getElementById("results-section"),
  resultImage: document.getElementById("result-image"),
  aiDescription: document.getElementById("ai-description"),
  downloadBtn: document.getElementById("download-btn"),
  errorDisplay: document.getElementById("error-display"),
  errorMessage: document.getElementById("error-message"),
  optionsSummary: document.getElementById("summary-content"),
  promptModal: document.getElementById("prompt-modal"),
  fullPrompt: document.getElementById("full-prompt"),
  apiResponse: document.getElementById("api-response"),
  closeModal: document.getElementById("close-modal"),
  copyPrompt: document.getElementById("copy-prompt"),
  viewPromptBtn: document.getElementById("view-prompt-btn"),
  resetBtn: document.getElementById("reset-btn"),
  healthStatus: document.getElementById("health-status"),
  cameraBtn: document.getElementById("camera-btn"),
  cameraModal: document.getElementById("camera-modal"),
  cameraVideo: document.getElementById("camera-video"),
  cameraCanvas: document.getElementById("camera-canvas"),
  captureBtn: document.getElementById("capture-btn"),
  closeCamera: document.getElementById("close-camera"),
  switchCameraBtn: document.getElementById("switch-camera"),
  cameraSound: document.getElementById("camera-sound"),
  
  // NEW ELEMENTS
  maintainAllToothShapes: document.getElementById("maintain_all_tooth_shapes"),
  gummySmileOptions: document.getElementById("gummy_smile_options"),
  incisorOptions: document.getElementById("incisor_options"),
  toothShapeCustom: document.getElementById("tooth_shape_custom"),
  preserveFacialAspect: document.getElementById("preserve_facial_aspect")
};

let cameraStream = null;
let soundUnlocked = false;
let currentFacingMode = "user"; // user | environment

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  checkHealthStatus();
  setupEventListeners();
  updateGenerateButton();
  updateOptionsSummary(); // Initialize summary
});

// Check server health
async function checkHealthStatus() {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();

    if (data.status === "ok") {
      elements.healthStatus.className =
        "mb-8 p-4 bg-green-50 border border-green-200 rounded-lg";
      elements.healthStatus.innerHTML = `
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 text-lg mr-3"></i>
          <div>
            <h3 class="font-medium text-green-800">System Ready</h3>
            <p class="text-sm text-green-600">
              Connected to server • OpenAI: ${data.openaiConfigured? "Available": "Not Configured"}
            </p>
          </div>
        </div>`;
    }
  } catch (error) {
    elements.healthStatus.className ="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg";
    elements.healthStatus.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-triangle text-red-500 text-lg mr-3"></i>
        <div>
          <h3 class="font-medium text-red-800">Server Connection Failed</h3>
          <p class="text-sm text-red-600">Please ensure the backend server is running on ${API_URL}</p>
        </div>
      </div>
    `;
  } finally {
    elements.healthStatus.classList.remove("hidden");
  }
}

// Setup event listeners
function setupEventListeners() {
  // File upload
  elements.uploadArea.addEventListener("click", () =>
    elements.imageInput.click()
  );
  elements.uploadButton.addEventListener("click", (e) => {
    e.stopPropagation();
    elements.imageInput.click();
  });
  elements.imageInput.addEventListener("change", handleImageSelect);
  elements.removeImage.addEventListener("click", removeImage);

  // Drag and drop
  elements.uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    elements.uploadArea.classList.add("drag-over");
  });

  elements.uploadArea.addEventListener("dragleave", () => {
    elements.uploadArea.classList.remove("drag-over");
  });

  elements.uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove("drag-over");
    if (e.dataTransfer.files.length) {
      handleImageSelect({ target: { files: e.dataTransfer.files } });
    }
  });

  // Option buttons (including new ones)
  document.querySelectorAll("[data-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const option = button.dataset.option;
      const value = button.dataset.value;

      // Handle tooth shape options
      if (option === "tooth_shape") {
        // Deselect all siblings in the same group
        button.parentElement
          .querySelectorAll(".option-card")
          .forEach((card) => {
            card.classList.remove("selected");
          });
        // Select clicked button
        button.classList.add("selected");
        state.selectedOptions[option] = value;
        
        // If custom tooth shape is selected, update tooth_preservation_mode
        if (option === "tooth_shape") {
          state.selectedOptions.tooth_preservation_mode = "custom";
          // Also update the radio button
          document.querySelector('input[name="tooth_preservation"][value="custom"]').checked = true;
        }
      }
      
      // Handle gummy smile severity options
      if (option === "gummy_smile_severity") {
        // Deselect all siblings in the same group
        button.parentElement
          .querySelectorAll(".option-card")
          .forEach((card) => {
            card.classList.remove("selected");
          });
        // Select clicked button
        button.classList.add("selected");
        state.selectedOptions[option] = value;
      }
      
      // Handle incisor method options
      if (option === "incisor_method") {
        // Deselect all siblings in the same group
        button.parentElement
          .querySelectorAll(".option-card")
          .forEach((card) => {
            card.classList.remove("bg-blue-50", "border-blue-300", "text-blue-700");
          });
        // Select clicked button
        button.classList.add("bg-blue-50", "border-blue-300", "text-blue-700");
        state.selectedOptions.incisor_improvement_mode = value;
      }

      // Handle original options
      if (
        [
          "arch",
          "teeth_count",
          "brighten",
          "correct_crowding_with_alignment",
        ].includes(option)
      ) {
        // Deselect all siblings
        button.parentElement
          .querySelectorAll(".option-card")
          .forEach((card) => {
            card.classList.remove("selected");
          });
        // Select clicked button
        button.classList.add("selected");
        state.selectedOptions[option] = value;
      }

      updateOptionsSummary();
      updateGenerateButton();
    });
  });

  // NEW: Tooth preservation radio buttons
  document.querySelectorAll('input[name="tooth_preservation"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      state.selectedOptions.tooth_preservation_mode = e.target.value;
      
      // Show/hide custom tooth shape options
      if (e.target.value === "custom") {
        elements.toothShapeCustom.style.display = "block";
        // Select first custom tooth shape option by default
        const firstCustomOption = elements.toothShapeCustom.querySelector(".option-card");
        if (firstCustomOption) {
          firstCustomOption.click();
        }
      } else {
        elements.toothShapeCustom.style.display = "none";
        // Set tooth_shape to maintain_existing if not custom
        state.selectedOptions.tooth_shape = "maintain_existing";
        document.querySelector('[data-option="tooth_shape"][data-value="maintain_existing"]')?.classList.add("selected");
      }
      
      updateOptionsSummary();
    });
  });

  // NEW: Maintain All Tooth Shapes checkbox
  if (elements.maintainAllToothShapes) {
    elements.maintainAllToothShapes.addEventListener("change", (e) => {
      if (e.target.checked) {
        // Force complete preservation mode
        document.querySelector('input[name="tooth_preservation"][value="complete"]').checked = true;
        state.selectedOptions.tooth_preservation_mode = "complete";
        elements.toothShapeCustom.style.display = "none";
        
        // Update all gummy smile options to show preservation
        document.querySelectorAll('[data-option="gummy_smile_severity"]').forEach(opt => {
          const statusText = opt.querySelector(".text-green-500");
          if (statusText) {
            statusText.textContent = "✓ Teeth preserved";
          }
        });
      }
      updateOptionsSummary();
    });
  }

  // Checkboxes (updated with new IDs)
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const id = e.target.id;
      state.selectedOptions[id] = e.target.checked;
      
      // Handle special cases for new checkboxes
      if (id === "reduce_gummy_smile") {
        if (e.target.checked) {
          elements.gummySmileOptions.style.display = "block";
          // Select first severity option by default
          const firstSeverityOption = elements.gummySmileOptions.querySelector(".option-card");
          if (firstSeverityOption) {
            firstSeverityOption.click();
          }
        } else {
          elements.gummySmileOptions.style.display = "none";
          state.selectedOptions.gummy_smile_severity = null;
        }
      }
      
      if (id === "improve_incisor_shape") {
        if (e.target.checked) {
          elements.incisorOptions.style.display = "block";
        } else {
          elements.incisorOptions.style.display = "none";
        }
      }
      
      if (id === "preserve_facial_aspect") {
        if (e.target.checked) {
          // Automatically check "Maintain All Tooth Shapes" when preserving facial aspect
          if (elements.maintainAllToothShapes) {
            elements.maintainAllToothShapes.checked = true;
            elements.maintainAllToothShapes.dispatchEvent(new Event("change"));
          }
        }
      }

      updateOptionsSummary();
      updateGenerateButton();
    });
  });

  // NEW: Incisor method radio buttons
  document.querySelectorAll('input[name="incisor_method"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      state.selectedOptions.incisor_improvement_mode = e.target.value;
      updateOptionsSummary();
    });
  });

  // Generate button
  elements.generateBtn.addEventListener("click", generateImage);

  // Reset
  elements.resetBtn.addEventListener("click", resetAll);

  // Download button
  elements.downloadBtn.addEventListener("click", downloadResult);
  
  // Camera functionality
  elements.cameraBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openCamera();
  });
  
  elements.captureBtn.addEventListener("click", capturePhoto);
  elements.closeCamera.addEventListener("click", closeCamera);
  elements.switchCameraBtn.addEventListener("click", switchCamera);

  // Initialize new sections
  initializeNewSections();
}

// Initialize new sections
function initializeNewSections() {
  // Set default states for new sections
  if (elements.maintainAllToothShapes) {
    elements.maintainAllToothShapes.checked = true;
  }
  
  if (elements.preserveFacialAspect) {
    elements.preserveFacialAspect.checked = true;
  }
  
  // Set default tooth preservation mode
  document.querySelector('input[name="tooth_preservation"][value="complete"]').checked = true;
  
  // Hide advanced options by default
  if (elements.gummySmileOptions) {
    elements.gummySmileOptions.style.display = "none";
  }
  
  if (elements.incisorOptions) {
    elements.incisorOptions.style.display = "none";
  }
  
  if (elements.toothShapeCustom) {
    elements.toothShapeCustom.style.display = "none";
  }
}

// Handle image selection
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showError("Please select an image file (JPEG, PNG, WebP)");
    return;
  }

  if (file.size > 30 * 1024 * 1024) {
    showError("File size exceeds 30MB limit");
    return;
  }

  state.imageFile = file;
  const reader = new FileReader();

  reader.onload = function (e) {
    elements.previewImg.src = e.target.result;
    elements.imageSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    elements.imagePreview.classList.remove("hidden");
    updateGenerateButton();
  };

  reader.readAsDataURL(file);
}

// Remove selected image
function removeImage() {
  state.imageFile = null;
  elements.imageInput.value = "";
  elements.imagePreview.classList.add("hidden");
  updateGenerateButton();
}

// Update generate button state
function updateGenerateButton() {
  const hasImage = !!state.imageFile;
  elements.generateBtn.disabled = !hasImage;
}

// Update options summary - UPDATED for new options
function updateOptionsSummary() {
  const summary = [];
  const options = state.selectedOptions;

  // Basic options
  if (options.arch) {
    summary.push(`<span class="text-blue-600">Arch:</span> ${options.arch}`);
  }
  if (options.teeth_count) {
    summary.push(`<span class="text-blue-600">Teeth:</span> ${options.teeth_count}`);
  }
  if (options.brighten) {
    summary.push(`<span class="text-blue-600">Brighten:</span> ${options.brighten}`);
  }
  
  // Tooth shape information based on preservation mode
  if (options.tooth_preservation_mode === "complete") {
    summary.push(`<span class="text-green-600">Tooth Preservation:</span> Complete (shapes maintained)`);
  } else if (options.tooth_preservation_mode === "edges_only") {
    summary.push(`<span class="text-green-600">Tooth Preservation:</span> Edge Contouring Only`);
  } else if (options.tooth_preservation_mode === "custom" && options.tooth_shape) {
    summary.push(`<span class="text-blue-600">Tooth Shape:</span> ${options.tooth_shape}`);
  }
  
  if (options.correct_crowding_with_alignment) {
    summary.push(`<span class="text-blue-600">Crowding:</span> ${options.correct_crowding_with_alignment}`);
  }

  // Gummy smile with severity
  if (options.reduce_gummy_smile && options.gummy_smile_severity) {
    summary.push(`<span class="text-green-600">✓ Gummy Smile Reduction:</span> ${options.gummy_smile_severity} (teeth preserved)`);
  } else if (options.reduce_gummy_smile) {
    summary.push(`<span class="text-green-600">✓ Gummy Smile Reduction</span>`);
  }

  // Incisor improvement with mode
  if (options.improve_incisor_shape) {
    const modeText = options.incisor_improvement_mode === "contouring" ? "Edge Contouring Only" : "Full Reshape";
    summary.push(`<span class="text-green-600">✓ Incisor Improvement:</span> ${modeText}`);
  }

  // Other boolean options
  const booleanOptions = [
    "widen_upper_teeth",
    "widen_lower_teeth",
    "close_spaces_evenly",
    "replace_missing_teeth",
    "improve_gum_recession",
    "correct_underbite",
    "correct_overbite",
    "add_characterisation",
  ];

  booleanOptions.forEach((opt) => {
    if (options[opt]) {
      const label = opt.replace(/_/g, " ");
      summary.push(`<span class="text-green-600">✓</span> ${label}`);
    }
  });

  // Facial aspect preservation
  if (options.preserve_facial_aspect) {
    summary.push(`<span class="text-green-600">✓ Preserve Facial Aspect</span>`);
  }

  if (summary.length === 0) {
    elements.optionsSummary.innerHTML = '<p class="text-sm text-gray-500 italic">No options selected yet</p>';
  } else {
    elements.optionsSummary.innerHTML = summary
      .map((item) => `<p class="text-sm text-gray-700">${item}</p>`)
      .join("");
  }
}

// Generate image - UPDATED to include new parameters
async function generateImage() {
  if (!state.imageFile) return;

  // Show processing
  elements.processingIndicator.classList.remove("hidden");
  elements.resultsSection.classList.add("hidden");
  elements.errorDisplay.classList.add("hidden");
  elements.generateBtn.disabled = true;

  // Simulate progress
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 20;
    if (progress > 90) clearInterval(progressInterval);
    elements.progressBar.style.width = `${Math.min(progress, 90)}%`;
    elements.progressText.textContent = getProgressMessage(progress);
  }, 300);

  // Prepare form data
  const formData = new FormData();
  formData.append("image", state.imageFile);

  // Add query parameters - UPDATED with new options
  Object.keys(state.selectedOptions).forEach((key) => {
    const value = state.selectedOptions[key];
    
    // Only send non-null, non-false values
    if (value !== null && value !== false && value !== undefined) {
      // For checkboxes, only send if true
      if (typeof value === "boolean") {
        if (value === true) {
          formData.append(key, "true");
        }
      } else {
        formData.append(key, value);
      }
    }
  });

  try {
    const response = await fetch(`${API_URL}/create-image`, {
      method: "POST",
      body: formData,
    });

    clearInterval(progressInterval);
    elements.progressBar.style.width = "100%";
    elements.progressText.textContent = "Complete!";

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // Store results
      state.results = data.data;

      // Update UI with results
      elements.resultImage.src = data.data.generatedImageUrl;

      // Show results
      setTimeout(() => {
        elements.processingIndicator.classList.add("hidden");
        elements.resultsSection.classList.remove("hidden");
        elements.generateBtn.disabled = false;
      }, 500);
    } else {
      throw new Error(data.error || "Generation failed");
    }
  } catch (error) {
    clearInterval(progressInterval);
    showError(error.message);
    elements.generateBtn.disabled = false;
  }
}

// Get progress message
function getProgressMessage(progress) {
  if (progress < 30) return "Analyzing image...";
  if (progress < 60) return "Processing with AI...";
  if (progress < 90) return "Generating modifications...";
  return "Finalizing results...";
}

// Show error
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorDisplay.classList.remove("hidden");
  elements.processingIndicator.classList.add("hidden");
}

// Download result
function downloadResult() {
  if (!state.results) return;

  const link = document.createElement("a");
  link.href = state.results.generatedImageUrl;
  link.download = "modified-dental-image.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Reset all - UPDATED for new options
function resetAll() {
  // Reset state
  state = {
    imageFile: null,
    selectedOptions: {
      arch: "upper",
      teeth_count: "6",
      brighten: null,
      correct_crowding_with_alignment: null,
      tooth_shape: "maintain_existing",
      tooth_preservation_mode: "complete",
      gummy_smile_severity: null,
      incisor_improvement_mode: "contouring",
      widen_upper_teeth: false,
      widen_lower_teeth: false,
      close_spaces_evenly: false,
      replace_missing_teeth: false,
      reduce_gummy_smile: false,
      improve_incisor_shape: false,
      improve_gum_recession: false,
      correct_underbite: false,
      correct_overbite: false,
      add_characterisation: false,
      preserve_facial_aspect: true,
    },
    results: null,
  };

  // Reset UI
  elements.imageInput.value = "";
  elements.imagePreview.classList.add("hidden");
  elements.resultsSection.classList.add("hidden");
  elements.errorDisplay.classList.add("hidden");
  elements.processingIndicator.classList.add("hidden");

  // Reset checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    if (cb.id === "maintain_all_tooth_shapes" || cb.id === "preserve_facial_aspect") {
      cb.checked = true; // Keep these checked by default
    } else {
      cb.checked = false;
    }
  });

  // Reset radio buttons
  document.querySelectorAll('input[type="radio"]').forEach((radio) => {
    if (radio.name === "tooth_preservation" && radio.value === "complete") {
      radio.checked = true;
    } else if (radio.name === "incisor_method" && radio.value === "contouring") {
      radio.checked = true;
    } else {
      radio.checked = false;
    }
  });

  // Reset option cards
  document.querySelectorAll(".option-card").forEach((card) => {
    card.classList.remove("selected", "bg-blue-50", "border-blue-300", "text-blue-700");
  });

  // Set defaults
  document.querySelector('[data-option="arch"][data-value="upper"]')?.classList.add("selected");
  document.querySelector('[data-option="teeth_count"][data-value="6"]')?.classList.add("selected");
  document.querySelector('[data-option="tooth_shape"][data-value="maintain_existing"]')?.classList.add("selected");

  // Hide advanced options sections
  if (elements.gummySmileOptions) {
    elements.gummySmileOptions.style.display = "none";
  }
  if (elements.incisorOptions) {
    elements.incisorOptions.style.display = "none";
  }
  if (elements.toothShapeCustom) {
    elements.toothShapeCustom.style.display = "none";
  }

  updateOptionsSummary();
  updateGenerateButton();

  // Show success message
  showTemporaryMessage("All settings have been reset");
}

// Show temporary message
function showTemporaryMessage(message) {
  const msg = document.createElement("div");
  msg.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
  msg.textContent = message;
  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 3000);
}

// Camera functions
async function openCamera() {
  closeCamera(); // ensure clean start

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: currentFacingMode },
      },
      audio: false,
    });

    elements.cameraVideo.srcObject = cameraStream;
    elements.cameraModal.classList.remove("hidden");
  } catch (err) {
    elements.healthStatus.innerHTML = ` 
      <div class="flex items-center">
        <i class="fas fa-exclamation-triangle text-red-500 text-lg mr-3"></i>
        <div>
          <h3 class="font-medium text-red-800">Failed to open Camera</h3>
          <p class="text-sm text-red-600">Camera not supported or permission denied</p>
        </div>
      </div>`;
    elements.healthStatus.classList.remove("hidden");
  }
}

async function switchCamera() {
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  await openCamera();
}

function capturePhoto() {
  elements.cameraSound.currentTime = 0;
  elements.cameraSound.play().catch(() => { });

  setTimeout(() => {
    const video = elements.cameraVideo;
    const canvas = elements.cameraCanvas;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "selfie.png", { type: "image/png" });

      handleImageSelect({
        target: { files: [file] },
      });

      closeCamera();
    }, "image/png");
  }, 700);
}

function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  elements.cameraModal.classList.add("hidden");
}

// Audio unlock for camera sound
let audioUnlocked = false;
document.addEventListener("touchstart", () => {
  if (!audioUnlocked) {
    elements.cameraSound.play().then(() => {
      elements.cameraSound.pause();
      elements.cameraSound.currentTime = 0;
      audioUnlocked = true;
    });
  }
}, { once: true });