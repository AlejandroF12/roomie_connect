// ─── Enums / Union Types ────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin'

export type RoomStatus = 'active' | 'paused' | 'deleted'

export type RoomType = 'private' | 'shared'

export type ReportStatus = 'pending' | 'review' | 'resolved' | 'rejected'

export type ReportReason =
  | 'spam'
  | 'inappropriate_content'
  | 'fake_listing'
  | 'harassment'
  | 'other'

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  username: string | null
  bio: string | null
  phone: string | null
  avatar_url: string | null
  instagram: string | null
  facebook: string | null
  twitter: string | null
  role: UserRole
  created_at: string
}

export interface Room {
  id: string
  owner_id: string
  title: string
  description: string
  price: number
  city: string
  zone: string | null
  latitude: number | null
  longitude: number | null
  room_type: RoomType
  available: boolean
  status: RoomStatus
  created_at: string
  updated_at: string
}

export interface RoomImage {
  id: string
  room_id: string
  url: string
  is_main: boolean
  display_order: number
  created_at: string
}

export interface RoomWithDetails extends Room {
  room_images: RoomImage[]
  owner: Pick<UserProfile, 'id' | 'username' | 'avatar_url' | 'bio' | 'phone' | 'instagram' | 'facebook' | 'twitter'>
}

export interface RoomCard {
  id: string
  title: string
  price: number
  city: string
  room_type: RoomType
  main_image_url: string | null
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  room_id: string
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  target_type: 'room' | 'user'
  target_id: string
  reason: ReportReason
  status: ReportStatus
  admin_comment: string | null
  created_at: string
}
