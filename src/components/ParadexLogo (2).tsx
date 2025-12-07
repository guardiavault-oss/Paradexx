import paradexLogo from 'figma:asset/a51b0759a884eb7e9d14d2f96d1b06e4a025bd77.png';

interface ParadexLogoProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export function ParadexLogo({
  className = '',
  width,
  height,
  alt = 'Paradex Logo',
}: ParadexLogoProps) {
  return (
    <img
      src={paradexLogo}
      alt={alt}
      className={className}
      width={width}
      height={height}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
      }}
    />
  );
}

export default ParadexLogo;
