/**
 * AttrScrollAnimator - Lightweight Scroll Animation via Data Attributes
 * Adds class to elements when they scroll into view using a viewport trigger line.
 * Behavior is configured entirely through data-attributes in your HTML.
 *
 * Author: Zack Pyle
 * URL: https://snippetnest.com/snippet/simple-scroll-triggered-animations-with-data-attributes/
 * Version: 1.2.0
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
 * 
 * data-scroll-children="true"
 *   - Optional. If set to "true", the element's direct children will be animated instead of 
 *     the element itself. Children will use the animation class as specified in
 *     data-scroll-animation-class.
 *   - If set to a class name (e.g. "outline-card"), any descendant elements with that class
 *     will be animated instead of only direct children.
 * 
 * data-scroll-children-stagger="0.1s"
 *   - Optional. Used with data-scroll-children. Sets a staggered delay between each child's 
 *     animation (e.g. "0.1s", "100ms"). If not specified, all children animate simultaneously.
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
        this.childrenAnimations = new Map();

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
        label.className = 'scroll-animation-debug';
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
        label.style.setProperty('visibility', 'visible', 'important');
        label.style.setProperty('display', 'block', 'important');
        label.style.setProperty('opacity', '1', 'important');
        return label;
    }

    createLine(labelText, top, color, fixed = false) {
        const line = document.createElement('div');
        line.className = 'scroll-animation-debug-line scroll-animation-debug';
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
        line.style.setProperty('visibility', 'visible', 'important');
        line.style.setProperty('display', 'block', 'important');
        line.style.setProperty('opacity', '1', 'important');

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

            const observer = new IntersectionObserver(entries => this.handleIntersection(entries), {
                threshold: 0,
                rootMargin: `${topMargin}px 0px ${bottomMargin}px 0px`
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
            const childrenAttr = element.getAttribute('data-scroll-children');
            const animateChildren = childrenAttr && childrenAttr !== 'false';

            if (elementTop <= triggerLine) {
                if (!animateChildren) {
                    element.classList.add(animationClass);

                    if (reverseClass) {
                        element.classList.remove(reverseClass);
                    }
                }

                this.hasAnimatedIn.add(element);
                
                if (animateChildren) {
                    this.animateChildren(element, true);
                }
                
            } else if (reverseAttr && this.hasAnimatedIn.has(element)) {
                if (!animateChildren) {
                    element.classList.remove(animationClass);

                    if (reverseClass) {
                        element.classList.add(reverseClass);
                    }
                } else {
                    this.animateChildren(element, false);
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
                    triggerLineEl.className = 'scroll-animation-trigger-line scroll-animation-debug';
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
                    triggerLineEl.style.setProperty('visibility', 'visible', 'important');
                    triggerLineEl.style.setProperty('display', 'block', 'important');
                    triggerLineEl.style.setProperty('opacity', '1', 'important');

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

    parseStaggerDelay(value) {
        if (!value) return 0;
        
        if (value.endsWith('ms')) {
            return parseFloat(value);
        } else if (value.endsWith('s')) {
            return parseFloat(value) * 1000;
        }
        
        return parseFloat(value);
    }
    
    animateChildren(parent, animateIn) {
        const animationClass = parent.getAttribute('data-scroll-animation-class');
        const childrenAttr = parent.getAttribute('data-scroll-children');
        
        let elements;
        
        if (childrenAttr && childrenAttr !== 'true') {
            elements = Array.from(parent.querySelectorAll(`.${childrenAttr}`)).filter(el => 
                !el.classList.contains('scroll-animation-trigger-line') && 
                !el.classList.contains('scroll-animation-debug')
            );
        } else {
            elements = Array.from(parent.children).filter(child => 
                !child.classList.contains('scroll-animation-trigger-line') && 
                !child.classList.contains('scroll-animation-debug')
            );
        }
        
        if (this.childrenAnimations.has(parent)) {
            this.childrenAnimations.get(parent).forEach(timeout => clearTimeout(timeout));
        }
        
        const reverseAttr = parent.getAttribute('data-scroll-animation-reverse');
        const hasReverseClass = reverseAttr && reverseAttr !== 'true';
        const reverseClass = hasReverseClass ? reverseAttr : null;
        
        const staggerAttr = parent.getAttribute('data-scroll-children-stagger');
        const staggerDelay = staggerAttr ? this.parseStaggerDelay(staggerAttr) : 0;
        
        const timeouts = [];
        
        elements.forEach((element, index) => {
            if (!staggerAttr) {
                if (animateIn) {
                    element.classList.add(animationClass);
                    if (reverseClass) element.classList.remove(reverseClass);
                } else if (reverseAttr) {
                    element.classList.remove(animationClass);
                    if (reverseClass) element.classList.add(reverseClass);
                }
                return;
            }
            
            const delay = index * staggerDelay;
            
            const timeout = setTimeout(() => {
                if (animateIn) {
                    element.classList.add(animationClass);
                    if (reverseClass) {
                        element.classList.remove(reverseClass);
                    }
                } else if (reverseAttr) {
                    element.classList.remove(animationClass);
                    if (reverseClass) {
                        element.classList.add(reverseClass);
                    }
                }
            }, delay);
            
            timeouts.push(timeout);
        });
        
        if (timeouts.length > 0) {
            this.childrenAnimations.set(parent, timeouts);
        }
    }

    destroy() {
        window.removeEventListener('resize', this.debouncedRefresh);

        this.positionObservers.forEach(observer => observer.disconnect());
        this.positionObservers.clear();
        this.observedElements.clear();
        this.observedThresholds.clear();
        this.hasAnimatedIn.clear();

        this.childrenAnimations.forEach(timeouts => {
            timeouts.forEach(timeout => clearTimeout(timeout));
        });
        this.childrenAnimations.clear();

        this.debugLines.forEach(lines => lines.forEach(line => line.remove()));
        this.debugLines.clear();
    }
}

const attrScrollAnimation = new AttrScrollAnimator();
window.attrScrollAnimation = attrScrollAnimation;
