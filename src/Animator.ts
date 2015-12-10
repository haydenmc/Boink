/**
 * A simple class to manage animations.
 */
class Animator {
	/**
	 * Applies an animation with the given CSS class name to the specified element.
	 * @param {HTMLElement} element The element to apply the animation to
	 * @param {string} name The name as defined by a CSS class
	 * @param {boolean?} transient Whether or not the animation should be removed after it has finished (default true)
	 */
	public static applyAnimation(element: HTMLElement, name: string, transient?: boolean): void {
		if (typeof transient === "undefined") {
			transient = true;
		}
		if (transient) {
			var endEvent = (evt) => {
				element.classList.remove(name);
				element.removeEventListener("animationend", endEvent);
			};
			element.addEventListener("animationend", endEvent);
		}
		element.classList.add(name);
	}
}
