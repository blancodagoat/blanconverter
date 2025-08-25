/* Image processing worker: resize + encode (png/jpg/webp/avif) */

// Lazy import for AVIF when needed
let avifModule = null;

self.onmessage = async (e) => {
	try {
		const { id, op } = e.data || {};
		if (op === 'image-convert') {
			const { buffer, fileId, type, targetExt, quality, maxEdge } = e.data;
			postMessage({ id, type: 'log', payload: { fileId, message: 'Worker: start image convert' } });

			const blob = new Blob([buffer], { type: type || 'application/octet-stream' });
			const bitmap = await createImageBitmap(blob);
			const originalWidth = bitmap.width;
			const originalHeight = bitmap.height;
			let targetWidth = originalWidth;
			let targetHeight = originalHeight;
			if (typeof maxEdge === 'number' && maxEdge > 0) {
				const longEdge = Math.max(originalWidth, originalHeight);
				if (longEdge > maxEdge) {
					const scale = maxEdge / longEdge;
					targetWidth = Math.round(originalWidth * scale);
					targetHeight = Math.round(originalHeight * scale);
				}
			}

			const off = new OffscreenCanvas(targetWidth, targetHeight);
			const ctx = off.getContext('2d');
			ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

			let outBuffer, outMime;
			const q = (quality || 'high').toLowerCase();
			const qCanvas = q === 'low' ? 0.5 : q === 'medium' ? 0.75 : 0.92;

			if (targetExt === 'avif') {
				if (!avifModule) {
					avifModule = await import(/* webpackChunkName: "squoosh-avif" */ '@jsquash/avif');
				}
				const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
				const avifEffort = typeof e.data.avifEffort === 'number' ? e.data.avifEffort : 4;
				const avifBuf = await avifModule.encode(imgData, { quality: q === 'low' ? 45 : q === 'medium' ? 30 : 20, effort: avifEffort });
				outBuffer = avifBuf.buffer ? avifBuf : new Uint8Array(avifBuf);
				outMime = 'image/avif';
			} else if (targetExt === 'jpg' || targetExt === 'jpeg') {
				// Use standard Canvas JPEG encoding for better compatibility
				const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
				const mime = 'image/jpeg';
				const blobOut = await off.convertToBlob({ type: mime, quality: qCanvas });
				outBuffer = new Uint8Array(await blobOut.arrayBuffer());
				outMime = mime;
			} else {
				const mime = targetExt === 'jpg' || targetExt === 'jpeg' ? 'image/jpeg' : targetExt === 'webp' ? 'image/webp' : 'image/png';
				const blobOut = mime === 'image/png' ? await off.convertToBlob({ type: mime }) : await off.convertToBlob({ type: mime, quality: qCanvas });
				outBuffer = new Uint8Array(await blobOut.arrayBuffer());
				outMime = mime;
			}

			postMessage({ id, type: 'result', payload: { buffer: outBuffer, mime: outMime } }, [outBuffer.buffer]);
			return;
		}
		postMessage({ id, type: 'error', error: 'Unknown op' });
	} catch (err) {
		try { postMessage({ id: e.data?.id, type: 'error', error: err?.message || String(err) }); } catch (_) {}
	}
};


