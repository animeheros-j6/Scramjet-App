"use strict";
// Opens the address in ?u= through the Scramjet proxy, filling the whole page.
// Vodious pages without a server of their own (the single .svg file) point their games and searches here.
(async () => {
	const msg = document.getElementById("msg");
	const fail = (text, detail) => {
		msg.hidden = false;
		msg.querySelector("p").textContent = text;
		msg.querySelector("pre").textContent = detail || "";
	};

	let target = "";
	try {
		const u = new URL(location.href).searchParams.get("u") || "";
		const parsed = new URL(u);
		if (parsed.protocol === "http:" || parsed.protocol === "https:") target = parsed.href;
	} catch (err) {
		/* no usable address */
	}
	if (!target) return fail("Nothing to open. Add ?u=https://example.com to the address.");

	try {
		const { ScramjetController } = $scramjetLoadController();
		const controller = new ScramjetController({
			files: {
				wasm: "/scram/scramjet.wasm.wasm",
				all: "/scram/scramjet.all.js",
				sync: "/scram/scramjet.sync.js",
			},
		});
		controller.init();
		await registerSW();
		const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
		const wisp = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
		if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
			await connection.setTransport("/libcurl/index.mjs", [{ websocket: wisp }]);
		}
		const frame = controller.createFrame();
		frame.frame.id = "sj-frame";
		frame.frame.allow = "autoplay; fullscreen; gamepad; clipboard-write; accelerometer; gyroscope";
		frame.frame.setAttribute("allowfullscreen", "");
		document.body.appendChild(frame.frame);
		frame.go(target);
	} catch (err) {
		fail("The proxy could not start.", String(err));
	}
})();
