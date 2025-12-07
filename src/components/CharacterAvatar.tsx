import { motion } from 'motion/react';

export type CharacterType = 
  | 'fire-demon'
  | 'ice-wizard'
  | 'cyber-punk'
  | 'space-ape'
  | 'neon-cat'
  | 'pixel-hero'
  | 'crypto-ghost'
  | 'moon-bear'
  | 'laser-eyes'
  | 'diamond-hands'
  | 'rocket-dude'
  | 'cool-pepe';

interface CharacterData {
  emoji: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  tribe: 'degen' | 'regen' | 'both';
}

export const CHARACTERS: Record<CharacterType, CharacterData> = {
  'fire-demon': {
    emoji: '😈',
    name: 'Fire Demon',
    rarity: 'epic',
    tribe: 'degen',
  },
  'ice-wizard': {
    emoji: '🧙',
    name: 'Ice Wizard',
    rarity: 'epic',
    tribe: 'regen',
  },
  'cyber-punk': {
    emoji: '🤖',
    name: 'Cyber Punk',
    rarity: 'rare',
    tribe: 'both',
  },
  'space-ape': {
    emoji: '🦍',
    name: 'Space Ape',
    rarity: 'legendary',
    tribe: 'degen',
  },
  'neon-cat': {
    emoji: '😺',
    name: 'Neon Cat',
    rarity: 'rare',
    tribe: 'both',
  },
  'pixel-hero': {
    emoji: '🦸',
    name: 'Pixel Hero',
    rarity: 'common',
    tribe: 'both',
  },
  'crypto-ghost': {
    emoji: '👻',
    name: 'Crypto Ghost',
    rarity: 'rare',
    tribe: 'both',
  },
  'moon-bear': {
    emoji: '🐻',
    name: 'Moon Bear',
    rarity: 'epic',
    tribe: 'regen',
  },
  'laser-eyes': {
    emoji: '👁️',
    name: 'Laser Eyes',
    rarity: 'legendary',
    tribe: 'degen',
  },
  'diamond-hands': {
    emoji: '💎',
    name: 'Diamond Hands',
    rarity: 'legendary',
    tribe: 'regen',
  },
  'rocket-dude': {
    emoji: '🚀',
    name: 'Rocket Dude',
    rarity: 'rare',
    tribe: 'degen',
  },
  'cool-pepe': {
    emoji: '🐸',
    name: 'Cool Pepe',
    rarity: 'legendary',
    tribe: 'both',
  },
};

interface CharacterAvatarProps {
  character: CharacterType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
  showRarity?: boolean;
  animate?: boolean;
}

export function CharacterAvatar({
  character,
  size = 'md',
  showBorder = true,
  showRarity = false,
  animate = true,
}: CharacterAvatarProps) {
  const characterData = CHARACTERS[character];

  const sizeClasses = {
    xs: 'w-8 h-8 text-lg',
    sm: 'w-10 h-10 text-xl',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-24 h-24 text-5xl',
  };

  const rarityColors = {
    common: '#9CA3AF',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  };

  const Container = animate ? motion.div : 'div';
  const containerProps = animate
    ? {
        whileHover: { scale: 1.1, rotate: 5 },
        whileTap: { scale: 0.95 },
      }
    : {};

  return (
    <div className="relative inline-block">
      <Container
        {...containerProps}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-white/10 ${
          showBorder ? 'border-2 border-white/20' : ''
        }`}
        style={
          showRarity
            ? {
                borderColor: rarityColors[characterData.rarity],
                boxShadow: `0 0 20px ${rarityColors[characterData.rarity]}40`,
              }
            : undefined
        }
      >
        {characterData.emoji}
      </Container>

      {showRarity && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black text-white uppercase"
          style={{ background: rarityColors[characterData.rarity] }}
        >
          {characterData.rarity[0]}
        </motion.div>
      )}
    </div>
  );
}

// Character Selector for Profile
export function CharacterSelector({
  selectedCharacter,
  onSelect,
  type,
}: {
  selectedCharacter: CharacterType;
  onSelect: (character: CharacterType) => void;
  type: 'degen' | 'regen';
}) {
  const isDegen = type === 'degen';
  const accentColor = isDegen ? '#DC143C' : '#0080FF';

  // Filter characters by tribe
  const availableCharacters = Object.entries(CHARACTERS).filter(
    ([_, data]) => data.tribe === type || data.tribe === 'both'
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">Choose Your Character</h3>
        <div className="flex gap-1">
          {(['common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
            <div
              key={rarity}
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  rarity === 'common'
                    ? '#9CA3AF'
                    : rarity === 'rare'
                    ? '#3B82F6'
                    : rarity === 'epic'
                    ? '#8B5CF6'
                    : '#F59E0B',
              }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {availableCharacters.map(([key, data]) => {
          const isSelected = key === selectedCharacter;
          const rarityColors = {
            common: '#9CA3AF',
            rare: '#3B82F6',
            epic: '#8B5CF6',
            legendary: '#F59E0B',
          };

          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(key as CharacterType)}
              className={`p-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'bg-white/10 border-white/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              style={
                isSelected
                  ? {
                      borderColor: accentColor,
                      boxShadow: `0 0 20px ${accentColor}40`,
                    }
                  : undefined
              }
            >
              <div className="relative">
                <div className="text-4xl mb-2 flex items-center justify-center">
                  {data.emoji}
                </div>
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ background: rarityColors[data.rarity] }}
                />
              </div>
              <div className="text-xs font-bold text-white truncate">
                {data.name}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {(['common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
          <div key={rarity} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background:
                  rarity === 'common'
                    ? '#9CA3AF'
                    : rarity === 'rare'
                    ? '#3B82F6'
                    : rarity === 'epic'
                    ? '#8B5CF6'
                    : '#F59E0B',
              }}
            />
            <span className="text-white/60 capitalize">{rarity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Get random character
export function getRandomCharacter(tribe?: 'degen' | 'regen'): CharacterType {
  const availableCharacters = Object.entries(CHARACTERS)
    .filter(([_, data]) => !tribe || data.tribe === tribe || data.tribe === 'both')
    .map(([key]) => key as CharacterType);

  return availableCharacters[
    Math.floor(Math.random() * availableCharacters.length)
  ];
}

// Get character by rarity
export function getCharactersByRarity(
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
): CharacterType[] {
  return Object.entries(CHARACTERS)
    .filter(([_, data]) => data.rarity === rarity)
    .map(([key]) => key as CharacterType);
}
