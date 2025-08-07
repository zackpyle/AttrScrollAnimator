# AttrScrollAnimator
Lightweight Scroll Animation via Data Attributes. Adds class to elements when they scroll into view using a viewport trigger line. Behavior is configured entirely through data-attributes in your HTML.

## Available Data Attributes

**`data-scroll-animation-class="fade-in"`**
  - Required. The class to apply when the element scrolls into view.

**`data-scroll-animation-threshold="0.75"`**
 - Optional. How far down the viewport the element must reach before triggering.
   Can be a decimal (e.g. 0.75, representing 75% of the viewport height), a pixel
   value (e.g. 200px), or any valid CSS length unit (e.g. 10rem). Defaults to 0.75.

**`data-scroll-animation-reverse="true"`**
 - Optional. If set to `"true"`, the animation class will be removed when the element scrolls back down below the threshold.
 - If set to a class name (e.g. `"fade-out"`), that class will be added instead of just removing the original.
 - Reverse animations will only fire after the element has been animated in before.

**`data-scroll-debug="true"`**
 - Optional. If set to true, shows visual lines for threshold and trigger.

**`data-scroll-children="true"`**
 - Optional. If set to "true", the element's direct children will be animated instead of the element itself. Children will use the animation class as specified in `data-scroll-animation-class`.
 - If set to a class name (e.g. `outline-card`), any descendant elements with that class will be animated instead of only direct children.

**`data-scroll-children-stagger="0.1s"`**
 - Optional. Used with data-scroll-children. Sets a staggered delay between each child's animation (e.g. "0.1s", "100ms"). If not specified, all children animate simultaneously.


## How it works

This script observes elements with the `data-scroll-animation-class` attribute and watches when their top edge crosses a percentage-based threshold of the viewport. When an element’s top moves above that line, it gets the class you specify.

You can control the trigger point using `data-scroll-animation-threshold` — which expects a value between 0 and 1 (e.g., 0.75 means 75% down the viewport – this is the default if you don’t include this attribute).

If you also include `data-scroll-animation-reverse`, you’ll have two options for the values:
- `data-scroll-animation-reverse="true"`
  - The animation class will be removed when the element scrolls back down the page below the threshold line.
- `data-scroll-animation-reverse="fade-out"` (or any other class name)
  - The animation class will be removed, and the specified class (like fade-out) will be added instead.
  - This is useful if you want to add a reverse @keyframes animation, for example.
  - To avoid visual glitches, the reverse class will only be applied after the element has animated in at least once.
 
**New in v1.2.0:** You can now animate child elements instead of the parent container using `data-scroll-children="true"`. This is perfect for animating lists, card grids, or any container where you want the individual items to animate rather than the wrapper.

You can also set data-scroll-children to a specific class name (e.g., `data-scroll-children="card"`) to target specific descendant elements with that class, giving you more precise control over which elements get animated.
When using child animations, you can also add `data-scroll-children-stagger="0.1s"` to create a staggered effect where each child animates with a delay between them. The stagger value can be specified in seconds (0.2s) or milliseconds (200ms).

No no extra setup — just add your data- attributes and your CSS animations for those classes.
