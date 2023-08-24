process.env.PORT = '9494';
const windowStateManager = require('electron-window-state');
const { app, BrowserWindow } = require('electron');
const contextMenu = require('electron-context-menu');
// const serve = require('electron-serve');

// try {
// 	require('electron-reloader')(module);
// } catch (e) {
// 	console.error(e);
// }

(async () => {
	await import('../build/index.js');
	// const serveURL = serve({ directory: '.' });
	const port = process.env.PORT || 5173;
	const dev = !app.isPackaged;
	let mainWindow;

	function createWindow() {
		let windowState = windowStateManager({
			defaultWidth: 800,
			defaultHeight: 600
		});

		const mainWindow = new BrowserWindow({
			backgroundColor: 'black',
			titleBarStyle: 'hidden',
			autoHideMenuBar: true,
			minHeight: 450,
			minWidth: 500,
			webPreferences: {
				enableRemoteModule: true,
				contextIsolation: true,
				nodeIntegration: true,
				spellcheck: false,
				devTools: true
			},
			x: windowState.x,
			y: windowState.y,
			width: windowState.width,
			height: windowState.height
		});

		windowState.manage(mainWindow);

		mainWindow.once('ready-to-show', () => {
			mainWindow.show();
			mainWindow.focus();
		});

		mainWindow.on('close', () => {
			windowState.saveState(mainWindow);
		});

		return mainWindow;
	}

	contextMenu({
		showLookUpSelection: false,
		showSearchWithGoogle: false,
		showCopyImage: false,
		prepend: (defaultActions, params, browserWindow) => [
			{
				label: 'Make App 💻'
			}
		]
	});

	function loadVite(port) {
		mainWindow.loadURL(`http://localhost:${port}`).catch((e) => {
			console.log('Error loading URL, retrying', e);
			setTimeout(() => {
				loadVite(port);
			}, 200);
		});
	}

	function createMainWindow() {
		mainWindow = createWindow();
		mainWindow.once('close', () => {
			mainWindow = null;
		});

		// window.loadURL('http://localhost:9494');
		loadVite(port);

		// if (dev) loadVite(port);
		// else
		// serveURL(mainWindow);
	}

	app.once('ready', createMainWindow);
	app.on('activate', () => {
		if (!mainWindow) {
			createMainWindow();
		}
	});
	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') app.quit();
	});
})();
