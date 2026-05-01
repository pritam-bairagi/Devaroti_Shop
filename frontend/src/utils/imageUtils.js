/**
 * Resizes an image file if it exceeds a maximum size.
 * @param {File} file - The image file to resize.
 * @param {Object} options - Resizing options.
 * @param {number} options.maxSizeKB - Maximum size in KB.
 * @param {number} options.maxWidth - Maximum width in pixels.
 * @param {number} options.maxHeight - Maximum height in pixels.
 * @returns {Promise<File>} - The resized image file.
 */
export const resizeImage = (file, { maxSizeKB = 512, maxWidth = 1024, maxHeight = 1024 } = {}) => {
  return new Promise((resolve, reject) => {
    // If file is already small enough, don't resize
    if (file.size <= maxSizeKB * 1024) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Quality adjustment loop to get under maxSizeKB
        let quality = 0.9;
        const getFile = (q) => {
          return new Promise((res) => {
            canvas.toBlob((blob) => {
              res(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            }, 'image/jpeg', q);
          });
        };

        const tryResize = async (q) => {
          const resizedFile = await getFile(q);
          if (resizedFile.size <= maxSizeKB * 1024 || q <= 0.1) {
            resolve(resizedFile);
          } else {
            await tryResize(q - 0.1);
          }
        };

        tryResize(quality);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};
