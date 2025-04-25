import React, { useEffect } from "react";

interface DynamicImageProps {
  path: string;
  alt: string;
  className?: string;
}

export default function DynamicImage({ path, alt, className = "" }: DynamicImageProps) {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const split = path.split('/');

        const image = new URL(`../assets/images/${split[0]}/${split[1]}`, import.meta.url).href;

        setImageSrc(image);
      } catch (error) {
        console.error(`Failed to load image for ${alt}:`, error);
        setImageSrc(null);
      }
    };

    loadImage();
  }, [path]);

  if (!imageSrc) {
    return <></>;
  }

  return <img src={imageSrc} alt={alt} className={className} />;
}
