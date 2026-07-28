/** Moves `node` to be a child of `target` (default document.body) once mounted, restoring it on destroy. */
export function portal(node: HTMLElement, target: string | HTMLElement = 'body') {
	const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
	targetEl?.appendChild(node);

	return {
		destroy() {
			node.remove();
		}
	};
}
