import React, { useState, useRef, useEffect } from "react";
import { ScanSearch, Camera, ImageUp, X } from "lucide-react";

const ShowOptions = ({ onImageSelect, onCameraCapture }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  const handleClick = () => {
    setShowOptions(!showOptions);
  };

  const handleCameraClick = () => {
    setShowOptions(false);
    setShowImageSearch(true);
    if (onCameraCapture) {
      // Trigger camera capture (you'll need to implement camera logic)
      onCameraCapture();
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
    setShowOptions(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setShowImageSearch(true);
      };
      reader.readAsDataURL(file);
      
      if (onImageSelect) {
        onImageSelect(file);
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setShowImageSearch(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={menuRef} className="absolute top-0 right-0 p-0 m-0">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main search button */}
      <button
        onClick={handleClick}
        className="p-1.5 m-0 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
      >
        <ScanSearch size={24} />
      </button>

      {/* Options menu */}
      {showOptions && (
        <div className="absolute mt-2 bg-white/70 rounded-lg shadow-lg border border-gray-200 p-1 flex flex-col gap-1">
          <button
            onClick={handleCameraClick}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors w-full text-left"
          >
            <Camera size={18} />
          </button>

          <button
            onClick={handleImageUploadClick}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors w-full text-left"
          >
            <ImageUp size={18} />
          </button>
        </div>
      )}

      {/* Image search preview modal */}
      {showImageSearch && previewImage && (
        <div className="fixed p-2 mt-[10px] bg-blur h-[500px] inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-2 max-w-md w-full shadow-lg border border-black-200">
            <div className="flex justify-between items-center">
              <h3 className="pl-2 text-lg font-semibold">Image Search</h3>
              <button
                onClick={handleRemoveImage}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="py-2">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full max-h-[400px] object-contain border border-gray-400 bg-gray-100 rounded-lg"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Implement search with image
                  console.log("Searching with image...");
                  setShowImageSearch(false);
                }}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Search..
              </button>
              <button
                onClick={handleRemoveImage}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowOptions;