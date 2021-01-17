const env = {
  isIpad: navigator.userAgent.match(/iPad/),
  isIphone: navigator.userAgent.match(/iPhone/),
};

class Proto {
  constructor(prototypeData) {
    this.prototypeData = prototypeData;
    this.buildUi();
  }

  preloadImages() {
    let $loadingProgress = $(".loading-progress");
    let numLoaded = 0;
    let numTotal = 0;

    function updateProgress_() {
      let scale = numTotal ? numLoaded / numTotal : 0;
      $loadingProgress.css("transform", `scaleX(${scale})`);
    }

    updateProgress_();

    function preloadImageUrl_(url) {
      return new Promise((resolve, reject) => {
        let img = document.createElement("img");
        img.src = url;
        img.onload = () => {
          ++numLoaded;
          updateProgress_();
          resolve();
        };
        img.onerror = () => {
          ++numLoaded;
          updateProgress_();
          console.error(`Error loading ${url}`);
          resolve();
        };
      });
    }

    let visitedArtboards = [];
    let imageUrls = new Set([]);

    let promises = [];
    Object.keys(this.prototypeData.artboards).forEach((id) => {
      promises.push(preloadImageUrl_(`${id}.png`));
      if (this.prototypeData.artboards[id].hasFixedLayers) {
        promises.push(preloadImageUrl_(`${id}_fixed.png`));
      }
    });

    numTotal = promises.length;
    return Promise.all(promises);
  }

  buildUi() {
    this.buildArtboards();

    this.preloadImages().then(() => $("body").removeClass("is-loading"));

    if (this.prototypeData.title) {
      document.title = this.prototypeData.title;
    }

    $(window).on("hashchange", () => {
      this.setArtboardVisible(this.getUrlInfo().artboardId);
    });

    $(document).click(() => {
      $(document.body).removeClass("highlight-hotspots");
      let f = document.body.offsetWidth;
      $(document.body).addClass("highlight-hotspots");
    });

    $(window).on("resize", () => this.resize());

    this.setArtboardVisible(this.getUrlInfo().artboardId);
  }

  resize() {
    let deviceWidth = window.innerWidth;
    let deviceHeight = window.innerHeight;

    if (window.navigator.standalone && (env.isIpad || env.isIphone)) {
      deviceWidth = screen.width;
      deviceHeight = screen.height;
    }

    let width = this.startArtboard.viewportWidth || this.startArtboard.width;
    let height = this.startArtboard.viewportHeight || this.startArtboard.height;
    if (
      this.currentArtboard.viewportWidth &&
      this.currentArtboard.viewportHeight
    ) {
      width = this.currentArtboard.viewportWidth;
      height = this.currentArtboard.viewportHeight;
    }

    let xScale = deviceHeight / height;
    let yScale = deviceWidth / width;
    $(".prototype-container").css({
      width: width,
      height: height,
      zoom: Math.min(1, Math.min(xScale, yScale)),
    });
    $("#phone-frame").css({
      width: width + 220,
      height: height + 220,
      zoom: Math.min(1, Math.min(xScale, yScale)),
    });
  }

  getUrlInfo() {
    let hash = window.location.hash;

    return {
      artboardId: hash
        ? hash.substring(1)
        : this.prototypeData.flowStartArtboardId,
    };
  }

  buildArtboards() {
    Object.keys(this.prototypeData.artboards).forEach((id) => {
      let artboardData = this.prototypeData.artboards[id];
      let $artboard = $("<div>")
        .addClass("artboard")
        .attr("data-artboard-id", id)
        .appendTo(".prototype-container");

      // add scrollable content
      let $artboardScrollContainer = $("<div>")
        .addClass("artboard-scroll-container")
        .appendTo($artboard);
      let $artboardScrollableContent = $("<div>")
        .addClass("artboard-content")
        .css({
          backgroundImage: `url(${id}.png)`,
          width: artboardData.width,
          height: artboardData.height,
        })
        .appendTo($artboardScrollContainer);

      // add fixed content
      if (artboardData.hasFixedLayers) {
        let $artboardFixedContainer = $("<div>")
          .addClass("artboard-fixed-container")
          .appendTo($artboard);
        let $artboardFixedContent = $("<div>")
          .addClass("artboard-content")
          .css({
            backgroundImage: `url(${id}_fixed.png)`,
            width: artboardData.width,
            height: artboardData.height,
          })
          .appendTo($artboardFixedContainer);
      }

      if (id == this.prototypeData.flowStartArtboardId) {
        // this is the start artboard
        this.startArtboard = artboardData;
        this.currentArtboard = artboardData;
      }

      artboardData.hotspots.forEach((hotspotData) => {
        let $hotspot = $("<div>")
          .addClass("hotspot")
          .attr("data-artboard-id", id)
          .css({
            left: hotspotData.rectangle.x,
            top: hotspotData.rectangle.y,
            width: hotspotData.rectangle.width,
            height: hotspotData.rectangle.height,
          })
          .appendTo(
            hotspotData.isFixed
              ? $artboard // don't add to $artboardFixedContent because of pointer-events:none
              : $artboardScrollableContent
          );
        $hotspot.click((event) => {
          this.gotoTarget(hotspotData.target);
          event.stopPropagation();
        });
      });
    });
  }

  gotoTarget(target) {
    if (target == "back") {
      history.back();
      return;
    }

    this.gotoArtboard(target);
  }

  gotoArtboard(artboardId) {
    window.location.href = "#" + artboardId;
  }

  setArtboardVisible(artboardId) {
    this.currentArtboard = this.prototypeData.artboards[artboardId];

    $(".artboard-scroll-container").scrollLeft(0).scrollTop(0);

    $(document.body).removeClass("highlight-hotspots");
    $(".artboard").removeClass("is-active");
    $(`.artboard[data-artboard-id="${artboardId}"]`).addClass("is-active");

    this.resize();
  }
}
