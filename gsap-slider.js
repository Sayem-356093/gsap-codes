/**
 * Webflow Template Carousel - Swiper-Style Infinite Loop
 * Requires: GSAP 3.x and Draggable plugin
 * Supports multiple carousels with seamless looping
 */

var Webflow = window.Webflow || {};
Webflow.push = Webflow.push || [];
Webflow.push(function() {
  // Ensure GSAP & Draggable loaded
  if (typeof gsap === 'undefined' || typeof Draggable === 'undefined') {
    console.error('GSAP or Draggable plugin not loaded');
    return;
  }
  
  // Register Draggable plugin
  gsap.registerPlugin(Draggable);
  
  // Find all carousel instances
  var carouselInstances = document.querySelectorAll('.slides-container');
  
  if (carouselInstances.length === 0) {
    console.error('No carousel instances found');
    return;
  }
  
  // Initialize each carousel
  carouselInstances.forEach(function(slidesContainer, index) {
    initCarousel(slidesContainer, index);
  });
  
  function initCarousel(slidesContainer, instanceIndex) {
    // Get elements within this specific carousel
    var slidesInner = slidesContainer.querySelector('.slides-inner');
    var originalSlides = slidesContainer.querySelectorAll('.slide');
    var progressBar = slidesContainer.querySelector('.progress-bar');
    var progressBarTrack = slidesContainer.querySelector('.progress-bar-track');
    var progressBlock = slidesContainer.querySelector('.progress-block');
    var prevButton = slidesContainer.querySelector('.carousel-prev');
    var nextButton = slidesContainer.querySelector('.carousel-next');
    
    // Validate required elements
    if (!slidesInner || originalSlides.length === 0) {
      console.error('Carousel #' + instanceIndex + ': Required elements not found');
      return;
    }
    
    // Ensure proper overflow handling
    slidesContainer.style.overflow = 'hidden';
    
    // Get gap from CSS
    var computedStyle = window.getComputedStyle(slidesInner);
    var gapValue = parseFloat(computedStyle.columnGap) || parseFloat(computedStyle.gap) || 0;
    
    var numOriginalSlides = originalSlides.length;
    
    // Calculate how many slides are visible at once
    var containerWidth = slidesContainer.offsetWidth;
    var slideWidth = originalSlides[0].offsetWidth;
    var slidesPerView = Math.ceil(containerWidth / (slideWidth + gapValue));
    
    // Clone enough slides to fill the view on both sides
    var clonesToCreate = Math.max(slidesPerView + 1, 3);
    
    // Clone first slides and append to end
    for (var i = 0; i < clonesToCreate; i++) {
      var clone = originalSlides[i % numOriginalSlides].cloneNode(true);
      clone.classList.add('clone', 'clone-end');
      slidesInner.appendChild(clone);
    }
    
    // Clone last slides and prepend to start
    for (var j = 0; j < clonesToCreate; j++) {
      var cloneIndex = numOriginalSlides - 1 - j;
      var clone = originalSlides[cloneIndex].cloneNode(true);
      clone.classList.add('clone', 'clone-start');
      slidesInner.insertBefore(clone, slidesInner.firstChild);
    }
    
    // Get all slides including clones
    var allSlides = slidesInner.querySelectorAll('.slide');
    var totalSlides = allSlides.length;
    
    // Configuration
    var config = {
      slideDuration: 0.3,
      gap: gapValue,
      numSlides: numOriginalSlides,
      totalWithClones: totalSlides,
      clonesToCreate: clonesToCreate,
      slidesPerView: slidesPerView,
      progressBlockWidth: 50
    };
    
    var state = {
      slideWidth: 0,
      totalWidth: 0,
      currentIndex: clonesToCreate, // Start at first real slide
      progressPerItem: 1 / (config.numSlides - 1),
      slideAnimation: null,
      isWrapping: false
    };
    
    state.threshold = state.progressPerItem / 5;
    
    // Utility functions
    function updateProgressBar(isDragging) {
      // Calculate which real slide we're on (accounting for clones)
      var realIndex = (state.currentIndex - config.clonesToCreate) % config.numSlides;
      if (realIndex < 0) realIndex += config.numSlides;
      
      // Update progress bar (if exists)
      if (progressBar) {
        var actualProgress = (realIndex / (config.numSlides - 1)) * 100;
        
        if (isDragging) {
          progressBar.style.transition = 'none';
        } else {
          progressBar.style.transition = 'width 0.3s ease-out';
        }
        
        progressBar.style.width = actualProgress + '%';
      }
      
      // Update progress block (if exists)
      if (progressBarTrack && progressBlock) {
        var progress = realIndex / (config.numSlides - 1);
        
        var trackWidth = progressBarTrack.offsetWidth;
        var blockWidth = config.progressBlockWidth;
        var maxBlockX = trackWidth - blockWidth;
        var blockX = progress * maxBlockX;
        
        if (isDragging) {
          progressBlock.style.transition = 'none';
        } else {
          progressBlock.style.transition = 'transform 0.3s ease-out';
        }
        
        gsap.set(progressBlock, { x: blockX });
      }
    }
    
    function calculatePosition(slideIndex) {
      return -(state.slideWidth + config.gap) * slideIndex;
    }
    
    function wrapSlide() {
      if (state.isWrapping) return;
      
      // If we've moved past the last real slide
      if (state.currentIndex >= config.clonesToCreate + config.numSlides) {
        state.isWrapping = true;
        var offset = state.currentIndex - (config.clonesToCreate + config.numSlides);
        state.currentIndex = config.clonesToCreate + offset;
        gsap.set(slidesInner, { x: calculatePosition(state.currentIndex) });
        setTimeout(function() { state.isWrapping = false; }, 50);
      }
      // If we've moved before the first real slide
      else if (state.currentIndex < config.clonesToCreate) {
        state.isWrapping = true;
        var offset = config.clonesToCreate - state.currentIndex;
        state.currentIndex = config.clonesToCreate + config.numSlides - offset;
        gsap.set(slidesInner, { x: calculatePosition(state.currentIndex) });
        setTimeout(function() { state.isWrapping = false; }, 50);
      }
      
      updateProgressBar(false);
    }
    
    // Set initial position
    gsap.set(slidesInner, { x: calculatePosition(state.currentIndex) });
    
    // Add transition to progress indicators
    if (progressBar) {
      progressBar.style.transition = 'width 0.3s ease-out';
    }
    
    if (progressBlock) {
      progressBlock.style.transition = 'transform 0.3s ease-out';
    }
    
    // Draggable instance
    var draggableInstance = Draggable.create(document.createElement('div'), {
      type: 'x',
      trigger: slidesContainer,
      onPress: function() {
        gsap.killTweensOf(slidesInner);
        this.startIndex = state.currentIndex;
        this.startX = this.x;
      },
      onDrag: function() {
        var dragDistance = this.x - this.startX;
        var newPosition = calculatePosition(this.startIndex) + dragDistance;
        
        gsap.set(slidesInner, { x: newPosition });
        
        var slidesMoved = -dragDistance / (state.slideWidth + config.gap);
        state.currentIndex = this.startIndex + slidesMoved;
        updateProgressBar(true);
      },
      onRelease: function() {
        var dragDistance = this.x - this.startX;
        var slidesMoved = -dragDistance / (state.slideWidth + config.gap);
        var newIndex = Math.round(this.startIndex + slidesMoved);
        
        state.currentIndex = newIndex;
        
        gsap.to(slidesInner, {
          x: calculatePosition(newIndex),
          duration: config.slideDuration,
          ease: 'power2.out',
          overwrite: true,
          onComplete: function() {
            wrapSlide();
          }
        });
        
        updateProgressBar(false);
      }
    })[0];
    
    // Navigation function
    function animateSlides(direction) {
      if (state.isWrapping) return;
      
      var newIndex = state.currentIndex + direction;
      state.currentIndex = newIndex;
      
      if (state.slideAnimation) {
        state.slideAnimation.kill();
      }
      
      state.slideAnimation = gsap.to(slidesInner, {
        x: calculatePosition(newIndex),
        duration: config.slideDuration,
        ease: 'power2.out',
        overwrite: true,
        onComplete: function() {
          wrapSlide();
        }
      });
      
      updateProgressBar(false);
    }
    
    // Resize handler
    function handleResize() {
      var computedStyle = window.getComputedStyle(slidesInner);
      config.gap = parseFloat(computedStyle.columnGap) || parseFloat(computedStyle.gap) || 0;
      
      state.slideWidth = allSlides[0].offsetWidth;
      
      // Recalculate slides per view
      var containerWidth = slidesContainer.offsetWidth;
      config.slidesPerView = Math.ceil(containerWidth / (state.slideWidth + config.gap));
      
      gsap.set(slidesInner, { x: calculatePosition(state.currentIndex) });
      updateProgressBar(false);
    }
    
    // Initialize
    handleResize();
    updateProgressBar(false);
    
    // Event listeners
    if (prevButton) {
      prevButton.addEventListener('click', function() {
        animateSlides(-1);
      });
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', function() {
        animateSlides(1);
      });
    }
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    window.addEventListener('beforeunload', function() {
      if (draggableInstance) {
        draggableInstance.kill();
      }
      if (state.slideAnimation) {
        state.slideAnimation.kill();
      }
    });
  }
});



{/* <div class="slides-container">
  <div class="slides-inner">
    <div class="slide">Slide A</div>
    <div class="slide">Slide B</div>
    <div class="slide">Slide C</div>
  </div>
  <div class="carousel-prev">←</div>
  <div class="carousel-next">→</div>
  <div class="progress-bar"></div>
  <div class="progress-bar-track">
  <div class="progress-block"></div>
  </div>
</div> */}
