/**
 * Simple JavaScript Window Manager
 * ================================
 * Author: Tomas Vaisar - tomas@vaisar.cz
 */

/**
 * Main method, that executes itself as soon it's loaded
 * @param window Global 'window' object
 * @param document Standart 'window.document' object
 * @param undefined This parameter should never be passed, so it's value is truly 'undefined'
 */
(function(window,document,undefined) {

	/**
	 * =======
	 * HELPERS
	 * =======
	 */

	/**
	 * Adds element as first child of another element
	 * @param child Element which is injected
	 * @param parent Element in which we inject to
	 */
	function prependElement(child, parent) {
		parent.insertBefore(child, parent.childNodes[0]);
	}

	/**
	 * Sets basic properties of desktop area
	 * @param desktop Element that should became desktop
	 */
	function prepareDesktopWorkspace(desktop) {
		desktop.style.position = 'relative';
	}

	/**
	 *
	 * @param window
	 */
	function wrapContent(window,document) {
		var content = document.createElement('div');
		content.setAttribute('class','window-content');
		content.innerHTML = window.innerHTML;
		window.innerHTML = null;
		window.appendChild(content);
	}

	/**
	 * Creates titlebar for given window
	 * @param window Element that desires titlebar
	 */
	function createTitlebar(window,document) {
		var title = window.getAttribute('title');
		var titlebar = document.createElement('div');

		titlebar.setAttribute('class','titlebar');

		titlebar.innerHTML = '';
		addIcon(window,titlebar,document);
		titlebar.innerHTML += title;

		// finally, put it into the window
		prependElement(titlebar,window);
	}

	/**
	 *
	 * @param window
	 * @param titlebar
	 * @param document
	 */
	function addIcon(window, titlebar, document) {
		var classes = window.getAttribute('class');
		var icons = classes.match(/icon\-(.)*/);
		if (icons !== null) {
			var icon = document.createElement('i');
			icon.setAttribute('class', icons[0]);
			titlebar.appendChild(icon);
		}
	}

	/**
	 * Brings given element to front of other element
	 * @param element Element that is desired to be in front of everything else
	 */
	function raiseWindow(element, desktop) {
		var maxZIndex = __getMaxZIndex(desktop);
		element.style.zIndex = ++maxZIndex;
	}

	/**
	 * Finds zIndexes of all windows and returns the highest one
	 * @param desktop Desktop that we are interested in
	 */
	function __getMaxZIndex(desktop) {
		var windows = desktop.querySelectorAll("div.window");
		var maxZIndex = 0;
		for (var i = 0; i < windows.length; i++) {
			var w = windows[i];
			if (w.style.zIndex > maxZIndex) {
				maxZIndex = w.style.zIndex;
			}
		}
		return maxZIndex;
	}

	/**
	 * =========
	 * DRAGGABLE
	 * =========
	 */

	/**
	 * Makes element draggable
	 * If the element is window, it applies automaticly on the titlebar
	 * @param window Window that should become draggable
	 * @param desktop Area in which we allow window to move
	 */
	function draggable(element, desktop) {
		var draggedElement = element.querySelector('div.titlebar');

		draggedElement.onmousedown = function(event) {
			__dragStart(event, desktop);
		};

		draggedElement.onmouseover = function(event) {
			event.target.style.cursor = 'move';
		}

		element.style.zIndex = 0;
	}

	/**
	 * Preparation for dragging
	 * @param event
	 * @param desktop
	 */
	function __dragStart(event, desktop) {
		var element = event.target.parentNode;

		var startX = parseInt(element.style.left);
		var startY = parseInt(element.style.top);

		if (isNaN(startX) || isNaN(startY)) {
			startX = 0;
			startY = 0;
		}

		element.startX = startX;
		element.startY = startY;
		element.cursorPosition = { x: event.clientX, y: event.clientY };

		// move window in front of others
		raiseWindow(element, desktop);

		event.target.onmouseup = __dragStop;
		event.target.onmousemove = function(ev) {
			__drag(ev,desktop);
		};
	}

	/**
	 * Dragging itself
	 * @param event
	 * @param desktop
	 */
	function __drag(event, desktop) {
		var element = event.target.parentNode;
		// set cursor
		event.target.style.cursor = "move";

		// current coordiantes
		var currX = event.clientX;
		var currY = event.clientY;

		// new coordiantes
		var newX = element.startX + currX - element.cursorPosition.x;
		var newY = element.startY + currY - element.cursorPosition.y;

		// check bounderies & move it!
		var relPosX = newX + element.offsetWidth;
		var relPosY = newY + element.offsetHeight;
		if (newX >= 0 && relPosX <= desktop.offsetWidth) { // X
			element.style.left = newX + "px";
		}
		if (newY >= 0 && relPosY <= desktop.offsetHeight) { // Y
			element.style.top = newY + "px";
		}
	}

	/**
	 * Dragging's end
	 * @param event
	 */
	function __dragStop(event) {
		var titlebar = event.target;

		// set cursor to default
		titlebar.style.cursor = "default";

		titlebar.onmousemove = null;
		titlebar.onmouseup = null;
	}

	/**
	 * =========
	 * RESIZABLE
	 * =========
	 *
	 * it is not perfect - it's possible to resize window outside of the desktop, but ... who cares ;)
	 */

	function resizable(element, desktop) {
		var draggedElement = undefined;

		var windowResizer = document.createElement('div'); // <- brakes DI :(
		windowResizer.setAttribute('class','window-resizer');
		windowResizer.onmouseover = function(event) {
			event.target.style.cursor = "se-resize";
		}

		// set proper position
		windowResizer.style.position = 'absolute';
		__setResizerPosition(windowResizer, element);

		draggedElement = windowResizer;

		draggedElement.onmousedown = function(event) {
			__resizeStart(event, element, desktop);
		};

		element.appendChild(windowResizer);

		element.style.zIndex = 0;
	}

	/**
	 * Preparation for dragging
	 * @param event
	 * @param desktop
	 */
	function __resizeStart(event, window, desktop) {
		var element = event.target;

		var startX = parseInt(element.style.left);
		var startY = parseInt(element.style.top);

		if (isNaN(startX) || isNaN(startY)) {
			startX = 0;
			startY = 0;
		}

		element.startX = startX;
		element.startY = startY;
		element.cursorPosition = { x: event.clientX, y: event.clientY };

		// move window in front of others
		raiseWindow(element, desktop);

		event.target.onmouseup = __resizeStop;
		event.target.onmousemove = function(ev) {
			__resize(ev, window, desktop);
		};
	}

	/**
	 * Resizing itself
	 * @param event
	 * @param desktop
	 */
	function __resize(event, window, desktop) {
		var element = event.target;

		// current coordiantes
		var currX = event.clientX;
		var currY = event.clientY;

		// new coordiantes
		var newX = element.startX + currX - element.cursorPosition.x;
		var newY = element.startY + currY - element.cursorPosition.y;

		// check bounderies & resize it!
		var relPosX = window.offsetLeft + newX + element.offsetWidth;
		var relPosY = window.offsetTop + newY + element.offsetHeight;

		if (newX >= 0 && relPosX <= desktop.offsetWidth) { // X
			element.style.left = newX + "px";
			window.style.width = (newX + element.offsetWidth) + "px";
		}
		if (newY >= 0 && relPosY <= desktop.offsetHeight) { // Y
			element.style.top = newY + "px";
			window.style.height = (newY + element.offsetHeight) + "px";
		}

	}

	/**
	 * Resizing's end
	 * @param event
	 */
	function __resizeStop(event) {
		var element = event.target;

		// set cursor to default
		element.style.cursor = "default";

		element.onmousemove = null;
		element.onmouseup = null;
	}

	function __setResizerPosition(resizer, window) {
		resizer.style.left = (window.offsetWidth - 16) + "px";
		resizer.style.top = (window.offsetHeight - 16) + "px";
	}

	/**
	 * ==============
	 * MAXIMALIZATION
	 * ==============
	 */

	/**
	 * Makes desired window maximalizable
	 * @param window
	 * @param desktop
	 */
	function maximalizabe(window, desktop) {
		window.maximalizabe = true;

		var titlebar = window.querySelector('div.titlebar');

		titlebar.ondblclick = function(event) {
			__maximize(event, desktop);
		}
	}

	/**
	 * Maximizes window
	 * @param event
	 * @param desktop
	 */
	function __maximize(event, desktop) {
		var window = event.target.parentNode;
		if (window.normalSize === undefined) {
			// save current state
			window.normalSize = { width: window.offsetWidth, height: window.offsetHeight };
			window.normalPosition = { left: parseInt(window.style.left), top: parseInt(window.style.top) };

			window.style.width = desktop.offsetWidth + "px";
			window.style.height = desktop.offsetHeight + "px";
			window.style.top = 0;
			window.style.left = 0;
		} else {
			// restore previous state
			window.style.width = window.normalSize.width + "px";
			window.style.height = window.normalSize.height + "px";
			window.style.top = window.normalPosition.top + "px";
			window.style.left = window.normalPosition.left + "px";

			window.normalSize = undefined;
		}

		var resizer = window.querySelector('div.window-resizer');
		__setResizerPosition(resizer,window);
	}

	// //////////////////////////////////////////////////////
	// LET'S GO!

	// find all desktops
	var desktops = document.querySelectorAll("div.desktop");
	for (var d_it = 0; d_it < desktops.length; d_it++) {
		// get current desktop
		var desktop = desktops[d_it];
		prepareDesktopWorkspace(desktop); //

		// get windows on current desktop
		var windows = desktop.querySelectorAll("div.window");
		for (var w_it = 0; w_it < windows.length; w_it++) {
			var w = windows[w_it];
			// wrap window's content
			//wrapContent(w,document);
			// add titlebar for every window
			createTitlebar(w,document);
			// make all windows draggable
			draggable(w,desktop);
			// make all windows resizable
			resizable(w,desktop);
			// make all windows maximalizable
			maximalizabe(w,desktop);

			// finally arrange windows a little bit
			w.style.top = (w_it+1)*50 + 'px';
			w.style.left = (w_it+1)*50 + 'px';
		}
	}

	// //////////////////////////////////////////////////////
	// EVENT RESETER

	document.onmouseup = function(event) {

		var desktops = document.querySelectorAll("div.desktop");
		for (var d_it = 0; d_it < desktops.length; d_it++) {
			// get current desktop
			var desktop = desktops[d_it];
			prepareDesktopWorkspace(desktop); //

			// get windows on current desktop
			var windows = desktop.querySelectorAll("div.window");
			for (var w_it = 0; w_it < windows.length; w_it++) {
				var w = windows[w_it];

				w.onmouseup = null;
				w.onmousemove = null;
				(w.querySelector('div.titlebar')).onmouseup = null;
				(w.querySelector('div.titlebar')).onmousemove = null;
				(w.querySelector('div.window-resizer')).onmouseup = null;
				(w.querySelector('div.window-resizer')).onmousemove = null;
			}
		}
	}

})(this, this.document);
