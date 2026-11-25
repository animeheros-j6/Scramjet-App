"use strict";
// The address of your Vodious server (the one that runs the proxy). Pages that have no server behind them, like the
// single vodious.svg file, send games and searches through it: <server>/go.html?u=<address>
(() => {
	const KEY = "vodious-proxy";

	function normalize(value) {
		let v = String(value || "").trim();
		if (!v) return "";
		if (!/^https?:\/\//i.test(v)) v = (/^(localhost|127\.|\[::1\])/i.test(v) ? "http://" : "https://") + v;
		try {
			return new URL(v).origin;
		} catch (err) {
			return "";
		}
	}

	function get() {
		try {
			return normalize(localStorage.getItem(KEY));
		} catch (err) {
			return "";
		}
	}

	function set(value) {
		const host = normalize(value);
		try {
			if (host) localStorage.setItem(KEY, host);
			else localStorage.removeItem(KEY);
		} catch (err) {
			/* storage blocked */
		}
		return host;
	}

	// The page on the server that opens an address through the proxy
	function url(target) {
		const host = get();
		return host ? host + "/go.html?u=" + encodeURIComponent(target) : "";
	}

	// Resolves if something answers at the address (it cannot tell what, only that the server is reachable)
	async function test(host) {
		const ctl = new AbortController();
		const timer = setTimeout(() => ctl.abort(), 8000);
		try {
			await fetch(host + "/favicon.ico?" + Date.now(), { mode: "no-cors", cache: "no-store", signal: ctl.signal });
		} finally {
			clearTimeout(timer);
		}
	}

	function buildUi() {
		const input = document.getElementById("proxy-host");
		if (!input) return;
		const status = document.getElementById("proxy-status");
		const say = (text) => {
			if (status) status.textContent = text;
		};
		input.value = get();
		const save = () => {
			const host = set(input.value);
			input.value = host;
			say(host ? "Saved. Games and searches from pages without a server will go through " + host + "." : "Removed.");
			return host;
		};
		document.getElementById("proxy-save").addEventListener("click", save);
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") save();
		});
		document.getElementById("proxy-clear").addEventListener("click", () => {
			input.value = "";
			save();
			say("Removed.");
		});
		document.getElementById("proxy-test").addEventListener("click", async () => {
			const host = save();
			if (!host) return say("Type your server's address first.");
			say("Checking " + host + "…");
			try {
				await test(host);
				say(host + " answered, so it is reachable.");
			} catch (err) {
				say("Could not reach " + host + ". Check the address and that the server is running.");
			}
		});
	}

	window.VodiousProxy = { get, set, url, test, buildUi };
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildUi);
	else buildUi();
})();
