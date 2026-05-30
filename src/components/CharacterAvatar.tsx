/**
 * CharacterAvatar Component
 * Displays character avatars with customizable images/initials
 * Used in material cards and character relationship displays
 */

import { useState, useRef } from 'react'
import { useStore } from '../store'
import { db, MaterialCard } from '../db'

interface Props {
  characterId: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  showTooltip?: boolean
  onClick?: () => void
  editable?: boolean
}

// Default avatar colors based on character name
const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', 
  '#3b82f6', '#ef4444', '#14b8a6', '#f59e0b', '#84cc16'
]

const getColorFromName = (name: string): string => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const getInitials = (name: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl'
}

export default function CharacterAvatar({ 
  characterId, 
  size = 'md', 
  showName = false, 
  showTooltip = true,
  onClick,
  editable = false
}: Props) {
  const { materialCards, updateMaterialCard } = useStore()
  const character = materialCards.find(c => c.id === characterId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  if (!character || character.type !== 'character') {
    return null
  }

  // Get avatar data from fields
  const avatarUrl = character.fields?.avatar as string | undefined
  const name = character.name
  const bgColor = getColorFromName(name)
  const initials = getInitials(name)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !character.id) return
    const charId = character.id

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      await updateMaterialCard(charId, {
        fields: { ...character.fields, avatar: dataUrl }
      })
      setShowEditMenu(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = async () => {
    if (!character.id) return
    const newFields = { ...character.fields }
    delete newFields.avatar
    await updateMaterialCard(character.id, { fields: newFields })
    setShowEditMenu(false)
  }

  const sizeClass = SIZE_CLASSES[size]

  const avatarElement = (
    <div className="relative group">
      <div
        onClick={onClick}
        className={`${sizeClass} rounded-full overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
          onClick ? 'hover:ring-2 hover:ring-indigo-400' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: bgColor }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Edit menu for editable avatars */}
      {editable && isHovered && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-full cursor-pointer"
          onClick={() => setShowEditMenu(!showEditMenu)}
        >
          <span className="text-white text-xs">📷</span>
        </div>
      )}

      {/* Edit dropdown */}
      {showEditMenu && editable && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowEditMenu(false)} 
          />
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden min-w-[120px]">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
            >
              上传头像
            </button>
            {avatarUrl && (
              <button
                onClick={handleRemoveImage}
                className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
              >
                移除头像
              </button>
            )}
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  )

  // Tooltip with character info
  if (showTooltip && !editable) {
    return (
      <div className="relative inline-block group/tooltip">
        {avatarElement}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="font-medium">{name}</div>
          {character.fields?.role && (
            <div className="text-gray-300 text-[10px]">{character.fields.role}</div>
          )}
          {character.fields?.description && (
            <div className="text-gray-300 text-[10px] mt-1 max-w-[200px] truncate">
              {character.fields.description}
            </div>
          )}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    )
  }

  if (showName) {
    return (
      <div className="flex items-center gap-2">
        {avatarElement}
        <div className="text-sm font-medium text-gray-700">{name}</div>
      </div>
    )
  }

  return avatarElement
}

/**
 * Avatar Group - displays multiple avatars in a stacked layout
 */
interface AvatarGroupProps {
  characterIds: number[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export function CharacterAvatarGroup({ characterIds, max = 4, size = 'sm' }: AvatarGroupProps) {
  const displayIds = characterIds.slice(0, max)
  const remaining = characterIds.length - max

  return (
    <div className="flex items-center">
      {displayIds.map((id, index) => (
        <div 
          key={id} 
          className="relative"
          style={{ marginLeft: index > 0 ? '-8px' : 0, zIndex: displayIds.length - index }}
        >
          <CharacterAvatar characterId={id} size={size} showTooltip />
        </div>
      ))}
      {remaining > 0 && (
        <div 
          className={`${SIZE_CLASSES[size]} rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium -ml-2`}
          style={{ marginLeft: '-8px' }}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
