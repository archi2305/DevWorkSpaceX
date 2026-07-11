'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import {
  User as UserIcon,
  Briefcase,
  CheckSquare,
  Clock,
  Settings,
  Mail,
  Globe,
  Award,
  Loader,
  Edit2
} from 'lucide-react'
import { userProfileService } from '@/services/user-profile'

export default function UserProfilePage() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  // Edit form states
  const [fullName, setFullName] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [bio, setBio] = useState('')
  const [skillsStr, setSkillsStr] = useState('')
  const [timezone, setTimezone] = useState('UTC')

  // 1. Fetch user profile payload
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await userProfileService.getMyProfile()
      // Pre-populate fields
      setFullName(res.user.full_name || '')
      setProfileImage(res.user.profile_image || '')
      setBio(res.user.bio || '')
      setSkillsStr((res.user.skills || []).join(', '))
      setTimezone(res.user.timezone || 'UTC')
      return res
    }
  })

  // 2. Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => userProfileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      setIsEditing(false)
    }
  })

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      full_name: fullName,
      profile_image: profileImage || undefined,
      bio: bio || undefined,
      skills: skillsStr ? skillsStr.split(',').map(s => s.trim()) : [],
      timezone
    })
  }

  if (isLoading || !profile) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader className="h-6 w-6 text-[#5BB98C] animate-spin" />
        </div>
      </MainLayout>
    )
  }

  const { user, assigned_tasks = [], projects = [], recent_activity = [] } = profile

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 text-left">
        
        {/* Banner / Header */}
        <div className="border border-white/[0.06] bg-gradient-to-r from-[#171A1D] to-[#121416] rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-lg">
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-[#1E2124] border border-white/[0.08] flex items-center justify-center">
            {user.profile_image ? (
              <img src={user.profile_image} alt={user.full_name} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-8 w-8 text-[#A7ADB5]" />
            )}
          </div>

          <div className="flex-1 space-y-2 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
              <h1 className="text-xl font-bold text-white">{user.full_name}</h1>
              <span className="text-[10px] font-bold text-[#5BB98C] bg-[#5BB98C]/10 px-2 py-0.5 rounded-full uppercase tracking-wider self-center">
                Workspace Member
              </span>
            </div>
            
            <p className="text-xs text-[#A7ADB5] flex items-center justify-center md:justify-start gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#7E848C]" /> {user.email}
            </p>
            <p className="text-xs text-[#A7ADB5] flex items-center justify-center md:justify-start gap-1.5">
              <Globe className="h-3.5 w-3.5 text-[#7E848C]" /> Timezone: {user.timezone || 'UTC'}
            </p>

            {user.bio && (
              <p className="text-xs italic text-[#7E848C] mt-2 max-w-xl">"{user.bio}"</p>
            )}

            {user.skills && user.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-start pt-2">
                {user.skills.map((skill) => (
                  <span key={skill} className="text-[9px] font-semibold text-white bg-white/5 border border-white/[0.04] px-2 py-0.5 rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-white/[0.08] hover:bg-white/5 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer self-center"
          >
            <Settings className="h-3.5 w-3.5" /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        {isEditing && (
          <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Update Profile Settings</h3>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[#A7ADB5] font-bold uppercase block">Display Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#121416] border border-white/[0.08] text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#5BB98C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#A7ADB5] font-bold uppercase block">Avatar Image URL</label>
                <input
                  type="text"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#121416] border border-white/[0.08] text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#5BB98C]"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] text-[#A7ADB5] font-bold uppercase block">Bio</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Software engineer focused on productivity tools..."
                  className="w-full bg-[#121416] border border-white/[0.08] text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#5BB98C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#A7ADB5] font-bold uppercase block">Skills (Comma Separated)</label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="React, Python, TypeScript"
                  className="w-full bg-[#121416] border border-white/[0.08] text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#5BB98C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#A7ADB5] font-bold uppercase block">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#121416] border border-white/[0.08] text-white px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#5BB98C]"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="md:col-span-2 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5BB98C] hover:bg-[#5BB98C]/90 text-[#111315] font-bold py-2.5 text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                Save Profile
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Assigned Tasks */}
          <div className="lg:col-span-2 border border-white/[0.06] bg-[#171A1D] rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-[#5BB98C]" /> Assigned Tasks ({assigned_tasks.length})
            </h3>

            <div className="divide-y divide-white/[0.06]">
              {assigned_tasks.map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{task.title}</span>
                    <span className="text-[9px] text-[#A7ADB5]">Status: {task.status} • Priority: {task.priority}</span>
                  </div>
                </div>
              ))}
              {assigned_tasks.length === 0 && (
                <div className="py-8 text-center text-xs text-[#7E848C]">
                  No active tasks assigned to you.
                </div>
              )}
            </div>
          </div>

          {/* Involved Projects */}
          <div className="border border-white/[0.06] bg-[#171A1D] rounded-2xl p-5 space-y-4 shadow-md self-start">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-400" /> Active Projects
            </h3>

            <div className="divide-y divide-white/[0.06]">
              {projects.map((proj) => (
                <div key={proj.id} className="py-2.5">
                  <span className="text-xs font-bold text-white block">{proj.name}</span>
                  {proj.description && <span className="text-[9px] text-[#A7ADB5] block mt-0.5 line-clamp-1">{proj.description}</span>}
                </div>
              ))}
              {projects.length === 0 && (
                <div className="py-8 text-center text-xs text-[#7E848C]">
                  No active project links found.
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="lg:col-span-3 border border-white/[0.06] bg-[#171A1D] rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" /> Recent Activity Timeline
            </h3>

            <div className="space-y-3">
              {recent_activity.map((act) => (
                <div key={act.id} className="text-xs flex items-center justify-between py-1 border-b border-white/[0.02] last:border-b-0">
                  <div className="space-y-0.5">
                    <span className="text-white block font-semibold">{act.action}</span>
                    <span className="text-[10px] text-[#A7ADB5]">{act.details}</span>
                  </div>
                  <span className="text-[9px] text-[#7E848C]">{new Date(act.created_at).toLocaleString()}</span>
                </div>
              ))}
              {recent_activity.length === 0 && (
                <div className="py-8 text-center text-xs text-[#7E848C]">
                  No activity logs found.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  )
}
