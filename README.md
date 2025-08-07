# AttrScrollAnimator
Lightweight Scroll Animation via Data Attributes. Adds class to elements when they scroll into view using a viewport trigger line. Behavior is configured entirely through data-attributes in your HTML.

## Available Data Attributes

**data-scroll-animation-class="fade-in"**
  - Required. The class to apply when the element scrolls into view.

**data-scroll-animation-threshold="0.75"**
 - Optional. How far down the viewport the element must reach before triggering.
   Can be a decimal (e.g. 0.75, representing 75% of the viewport height), a pixel
   value (e.g. 200px), or any valid CSS length unit (e.g. 10rem). Defaults to 0.75.

**data-scroll-animation-reverse="true"**
 - Optional. If set to `"true"`, the animation class will be removed when the element scrolls back down below the threshold.
 - If set to a class name (e.g. `"fade-out"`), that class will be added instead of just removing the original.
 - Reverse animations will only fire after the element has been animated in before.

**data-scroll-debug="true"**
 - Optional. If set to true, shows visual lines for threshold and trigger.
