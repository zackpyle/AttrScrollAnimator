/**
 * AttrScrollAnimator - Lightweight Scroll Animation via Data Attributes
 * Adds class to elements when they scroll into view using a viewport trigger line.
 * Behavior is configured entirely through data-attributes in your HTML.
 *
 * Author: Zack Pyle
 * URL: https://snippetnest.com/snippet/simple-scroll-triggered-animations-with-data-attributes/
 * Version: 1.1.0
 *
 * === Available Data Attributes ===
 * 
 * data-scroll-animation-class="fade-in"
 *   - Required. The class to apply when the element scrolls into view.
 *
 * data-scroll-animation-threshold="0.75"
 *   - Optional. How far down the viewport the element must reach before triggering.
 *     Can be a decimal (e.g. 0.75, representing 75% of the viewport height), a pixel
 *     value (e.g. 200px), or any valid CSS length unit (e.g. 10rem). Defaults to 0.75.
 *
 * data-scroll-animation-reverse="true"
 *   - Optional. If set to `"true"`, the animation class will be removed when the element
 *     scrolls back down below the threshold.
 *   - If set to a class name (e.g. `"fade-out"`), that class will be added instead of
 *     just removing the original.
 *   - Reverse animations will only fire after the element has been animated in before.
 *
 * data-scroll-debug="true"
 *   - Optional. If set to true, shows visual lines for threshold and trigger.
 */

class AttrScrollAnimator {
    constructor(options = {}) {
        this.options = {
            viewportPosition: 0.75,
            ...options
        };

        this.observedElements = new Set();
        this.positionObservers = new Map();
        this.observedThresholds = new Map();
        this.hasAnimatedIn = new Set();
        this.debugLines = new Map();

        this.debugColors = [
            'hsl(160, 100%, 40%)',
            'hsl(220, 100%, 40%)',
            'hsl(280, 100%, 40%)',
            'hsl(330, 100%, 40%)',
            'hsl(0, 100%, 40%)'
        ];

        this.debouncedRefresh = this.debounce(this.refresh.bind(this), 200);
        window.addEventListener('resize', this.debouncedRefresh);
        window.addEventListener('load', () => this.init());
    }

    parseThreshold(value) {
        if (!value) return this.options.viewportPosition;
        if (value.endsWith('px')) return parseInt(value, 10) / window.innerHeight;
        const parsed = parseFloat(value);
        return !isNaN(parsed) ? parsed : this.options.viewportPosition;
    }

    generateColorForThreshold(index) {
        return this.debugColors[index % this.debugColors.length];
    }

    debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    createDebugLabel(text, color) {
        const label = document.createElement('div');
        label.textContent = text;
        Object.assign(label.style, {
            position: 'absolute',
            left: '0',
            top: '-1.2em',
            fontSize: '12px',
            background: 'white',
            color: color,
            padding: '2px 6px',
            border: `1px solid ${color}`,
            borderRadius: '3px'
        });
        return label;
    }

    createLine(labelText, top, color, fixed = false) {
        const line = document.createElement('div');
        line.className = 'scroll-animation-debug-line';
        Object.assign(line.style, {
            position: fixed ? 'fixed' : 'absolute',
            top: `${top}px`,
            left: '0',
            width: '100%',
            height: '0',
            borderTop: `2px dashed ${color}`,
            zIndex: '9999',
            pointerEvents: 'none'
        });

        line.appendChild(this.createDebugLabel(labelText, color));
        document.body.appendChild(line);
        return line;
    }

    createPositionObserver(position) {
        if (!this.positionObservers.has(position)) {
            const viewportHeight = window.innerHeight;
            const triggerLinePosition = viewportHeight * position;
            const topMargin = -triggerLinePosition;
            const bottomMargin = -(viewportHeight - triggerLinePosition - 1);
            const rootMargin = `${topMargin}px 0px ${bottomMargin}px 0px`;

            const observer = new IntersectionObserver(this.handleIntersection.bind(this), {
                root: null,
                rootMargin,
                threshold: 0
            });

            this.positionObservers.set(position, observer);
        }

        return this.positionObservers.get(position);
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            const element = entry.target;
            const animationClass = element.getAttribute('data-scroll-animation-class');
            const reverseAttr = element.getAttribute('data-scroll-animation-reverse');
            const threshold = this.observedThresholds.get(element) ?? this.options.viewportPosition;

            if (!animationClass) return;

            const triggerLine = window.innerHeight * threshold;
            const elementTop = entry.boundingClientRect.top;

            const hasReverseClass = reverseAttr && reverseAttr !== 'true';
            const reverseClass = hasReverseClass ? reverseAttr : null;

            if (elementTop <= triggerLine) {
                element.classList.add(animationClass);

                if (reverseClass) {
                    element.classList.remove(reverseClass);
                }

                this.hasAnimatedIn.add(element);
            } else if (reverseAttr && this.hasAnimatedIn.has(element)) {
                element.classList.remove(animationClass);

                if (reverseClass) {
                    element.classList.add(reverseClass);
                }
            }
        });
    }

    init() {
        const elements = document.querySelectorAll('[data-scroll-animation-class]');

        elements.forEach((element, index) => {
            const animationClass = element.getAttribute('data-scroll-animation-class');
            if (!animationClass || element.classList.contains(animationClass)) return;

            const positionAttr = element.getAttribute('data-scroll-animation-threshold');
            const position = this.parseThreshold(positionAttr);

            const observer = this.createPositionObserver(position);
            observer.observe(element);

            this.observedElements.add(element);
            this.observedThresholds.set(element, position);

            if (element.getAttribute('data-scroll-debug') === 'true') {
                const color = this.generateColorForThreshold(index);

                const drawDebugLines = () => {
                    const thresholdLineEl = this.createLine(`Threshold (${position})`, window.innerHeight * position, color, true);

                    const triggerLineEl = document.createElement('div');
                    triggerLineEl.className = 'scroll-animation-trigger-line';
                    Object.assign(triggerLineEl.style, {
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '0',
                        borderTop: `2px dashed ${color}`,
                        pointerEvents: 'none',
                        zIndex: '9999'
                    });

                    triggerLineEl.appendChild(this.createDebugLabel(`Trigger - (Threshold ${position})`, color));

                    if (getComputedStyle(element).position === 'static') {
                        element.style.position = 'relative';
                    }

                    element.appendChild(triggerLineEl);
                    this.debugLines.set(element, [triggerLineEl, thresholdLineEl]);
                };

                let frames = 0;
                const waitForStable = () => {
                    if (frames < 5) {
                        frames++;
                        requestAnimationFrame(waitForStable);
                    } else {
                        drawDebugLines();
                    }
                };

                waitForStable();
            }
        });
    }

    refresh() {
        this.destroy();
        this.init();
    }

    destroy() {
        window.removeEventListener('resize', this.debouncedRefresh);

        this.positionObservers.forEach(observer => observer.disconnect());
        this.positionObservers.clear();
        this.observedElements.clear();
        this.observedThresholds.clear();
        this.hasAnimatedIn.clear();

        this.debugLines.forEach(lines => lines.forEach(line => line.remove()));
        this.debugLines.clear();
    }
}

const attrScrollAnimation = new AttrScrollAnimator();
window.attrScrollAnimation = attrScrollAnimation;
