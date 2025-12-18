/**
 * Native Scroll Drag Slider - Multi-Instance Support
 * Requires: GSAP 3.x and Draggable plugin
 * Enhances native scrolling with smooth drag interaction
 */
var Webflow = window.Webflow || {};
Webflow.push = Webflow.push || [];
Webflow.push(function () {
  if (typeof gsap === "undefined" || typeof Draggable === "undefined") {
    console.error("GSAP or Draggable plugin not loaded");
    return;
  }

  gsap.registerPlugin(Draggable);

  // Configuration
  var config = {
    dampingFactor: 0.85, // Smooth momentum (0.8-0.9 recommended)
    velocityBoost: 1.2, // Boost on drag end
    throwProps: true, // Enable momentum throw
  };

  // Find all slider instances
  var sliderInstances = document.querySelectorAll(".drag-container");

  if (sliderInstances.length === 0) {
    console.error("No slider instances found with class .drag-container");
    return;
  }

  // Initialize each slider
  sliderInstances.forEach(function (container, index) {
    initSlider(container, index);
  });

  function initSlider(container, instanceIndex) {
    // Get inner element
    var inner = container.querySelector(".drag-inner");

    if (!inner) {
      console.error("Slider #" + instanceIndex + ": .drag-inner not found");
      return;
    }

    // Ensure container has overflow
    container.style.overflowX = "auto";
    container.style.overflowY = "hidden";

    // State for this instance
    var state = {
      draggableInstance: null,
      velocity: 0,
      targetScroll: 0,
      isScrolling: false,
      tickerId: null,
    };

    // Smooth momentum scrolling
    function tickerUpdate() {
      if (!state.isScrolling) return;

      state.velocity *= config.dampingFactor;
      state.targetScroll += state.velocity;

      // Clamp to bounds
      var maxScroll = container.scrollWidth - container.offsetWidth;

      if (state.targetScroll < 0) {
        state.targetScroll += (0 - state.targetScroll) * 0.2;
        state.velocity = 0;
      }
      if (state.targetScroll > maxScroll) {
        state.targetScroll += (maxScroll - state.targetScroll) * 0.2;
        state.velocity = 0;
      }

      container.scrollLeft = state.targetScroll;

      // Stop when velocity is very small
      if (Math.abs(state.velocity) < 0.1) {
        state.isScrolling = false;
      }
    }

    // Add ticker
    state.tickerId = gsap.ticker.add(tickerUpdate);

    // Create draggable
    function createDraggable() {
      if (state.draggableInstance) {
        state.draggableInstance.kill();
      }

      var startScroll = 0;

      state.draggableInstance = Draggable.create(container, {
        type: "scrollLeft",
        edgeResistance: 0.65,
        inertia: false,
        onPress: function () {
          state.velocity = 0;
          state.isScrolling = false;
          startScroll = container.scrollLeft;
          state.targetScroll = startScroll;
        },
        onDrag: function () {
          var newScroll = container.scrollLeft;
          state.velocity = startScroll - newScroll;
          state.targetScroll = newScroll;
          startScroll = newScroll;
        },
        onDragEnd: function () {
          state.velocity *= config.velocityBoost;
          state.isScrolling = true;
        },
      })[0];
    }

    // Initialize
    createDraggable();
    state.targetScroll = container.scrollLeft;

    // Handle resize for this instance
    function handleResize() {
      if (state.draggableInstance) {
        state.draggableInstance.kill();
      }
      createDraggable();
      state.targetScroll = container.scrollLeft;
    }

    window.addEventListener("resize", handleResize);

    // Cleanup on page unload
    window.addEventListener("beforeunload", function () {
      if (state.draggableInstance) {
        state.draggableInstance.kill();
      }
      if (state.tickerId) {
        gsap.ticker.remove(tickerUpdate);
      }
      window.removeEventListener("resize", handleResize);
    });
  }
});

/*<div class="drag-container">
  <div class="drag-inner">
    <!-- Your scrollable content -->
  </div>
</div>*/
