var config = {
  dampingFactor: 0.85,
  velocityBoost: 1.2,
  edgeResistance: 0.65,
};

// Find all slider instances
var sliderInstances = document.querySelectorAll(".drag-container");

if (sliderInstances.length === 0) {
  console.error("No slider instances found with class .drag-container");
  return;
}

// Initialize each slider
sliderInstances.forEach(function (wrapper, index) {
  initSlider(wrapper, index);
});

function initSlider(wrapper, instanceIndex) {
  var inner = wrapper.querySelector(".drag-inner");
  var progressBar = wrapper.querySelector(".drag-track");
  var progressBlock = wrapper.querySelector(".drag-block");

  if (!inner) {
    console.error("Slider #" + instanceIndex + ": .drag-inner not found");
    return;
  }

  var state = {
    draggableInstance: null,
    blockDraggable: null,
    currentX: 0,
    velocity: 0,
  };

  // --------------------------------------------------
  // Progress block positioning
  // --------------------------------------------------
  function updateProgressBlock() {
    if (!progressBar || !progressBlock) return;

    var wrapperWidth = wrapper.offsetWidth;
    var innerWidth = inner.scrollWidth;
    var maxScroll = innerWidth - wrapperWidth;

    if (maxScroll <= 0) {
      gsap.set(progressBlock, { x: 0 });
      return;
    }

    var progress = Math.abs(state.currentX) / maxScroll;
    progress = Math.max(0, Math.min(1, progress));

    var trackWidth = progressBar.offsetWidth;
    var blockWidth = progressBlock.offsetWidth;
    var maxBlockX = trackWidth - blockWidth;

    gsap.set(progressBlock, {
      x: progress * maxBlockX,
    });
  }

  // --------------------------------------------------
  // Momentum ticker
  // --------------------------------------------------
  function tickerUpdate() {
    state.velocity *= config.dampingFactor;
    state.currentX += state.velocity;

    var wrapperWidth = wrapper.offsetWidth;
    var innerWidth = inner.scrollWidth;
    var minX = Math.min(0, wrapperWidth - innerWidth);
    var maxX = 0;

    if (state.currentX > maxX) {
      state.currentX += (maxX - state.currentX) * 0.2;
      state.velocity = 0;
    }

    if (state.currentX < minX) {
      state.currentX += (minX - state.currentX) * 0.2;
      state.velocity = 0;
    }

    gsap.set(inner, { x: state.currentX });
    updateProgressBlock();
  }

  gsap.ticker.add(tickerUpdate);

  // --------------------------------------------------
  // Content draggable
  // --------------------------------------------------
  function createContentDraggable() {
    if (state.draggableInstance) {
      state.draggableInstance.kill();
    }

    var wrapperWidth = wrapper.offsetWidth;
    var innerWidth = inner.scrollWidth;

    state.draggableInstance = Draggable.create(inner, {
      type: "x",
      bounds: {
        minX: wrapperWidth - innerWidth,
        maxX: 0,
      },
      edgeResistance: config.edgeResistance,
      inertia: false,
      onPress: function () {
        state.velocity = 0;
      },
      onDrag: function () {
        var newX = gsap.getProperty(inner, "x");
        state.velocity = newX - state.currentX;
        state.currentX = newX;
        updateProgressBlock();
      },
      onDragEnd: function () {
        state.velocity *= config.velocityBoost;
      },
    })[0];
  }

  // --------------------------------------------------
  // Progress block draggable
  // --------------------------------------------------
  function createBlockDraggable() {
    if (!progressBar || !progressBlock) return;

    if (state.blockDraggable) {
      state.blockDraggable.kill();
    }

    state.blockDraggable = Draggable.create(progressBlock, {
      type: "x",
      bounds: progressBar,
      inertia: false,
      onPress: function () {
        state.velocity = 0;
      },
      onDrag: function () {
        var trackWidth = progressBar.offsetWidth;
        var blockWidth = progressBlock.offsetWidth;
        var maxBlockX = trackWidth - blockWidth;

        if (maxBlockX <= 0) return;

        var progress = this.x / maxBlockX;
        progress = Math.max(0, Math.min(1, progress));

        var wrapperWidth = wrapper.offsetWidth;
        var innerWidth = inner.scrollWidth;
        var maxScroll = innerWidth - wrapperWidth;

        state.currentX = -progress * maxScroll;
        gsap.set(inner, { x: state.currentX });
      },
      onDragEnd: function () {
        state.velocity = 0;
      },
    })[0];
  }

  // --------------------------------------------------
  // Init
  // --------------------------------------------------
  createContentDraggable();
  createBlockDraggable();
  updateProgressBlock();

  // --------------------------------------------------
  // Resize handling
  // --------------------------------------------------
  function handleResize() {
    createContentDraggable();
    createBlockDraggable();
    updateProgressBlock();
  }

  window.addEventListener("resize", handleResize);

  // --------------------------------------------------
  // Cleanup
  // --------------------------------------------------
  window.addEventListener("beforeunload", function () {
    if (state.draggableInstance) state.draggableInstance.kill();
    if (state.blockDraggable) state.blockDraggable.kill();
    gsap.ticker.remove(tickerUpdate);
    window.removeEventListener("resize", handleResize);
  });
}

/* <div class="drag-container">
  <div class="drag-inner">
    <!-- Your draggable content -->
  </div>
  
  <!-- Optional progress indicator -->
  <div class="drag-track">
    <div class="drag-block"></div>
  </div>
</div> */
