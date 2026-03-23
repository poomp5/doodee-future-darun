'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { User, Mail, Save, Edit, Share2, Camera, AtSign, School } from 'lucide-react';
import Image from 'next/image';
import { showToast } from '@/lib/toast';
import CropModal from './CropModal';
import SearchSelect from '@/components/SearchSelect';
import useSWR, { useSWRConfig } from "swr";

interface BasicProfileFormProps {
  user: any;
  connectedProviders: {
    google: boolean;
    discord: boolean;
  };
  sessionUser: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

export default function BasicProfileForm({
  user: initialUser,
  connectedProviders,
  sessionUser,
}: BasicProfileFormProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();

  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(initialUser);
  const [editedUser, setEditedUser] = useState({
    first_name: initialUser?.first_name || '',
    last_name: initialUser?.last_name || '',
    bio: initialUser?.bio || '',
    username: initialUser?.username || '',
  });
  const [isPublic, setIsPublic] = useState(initialUser?.is_public ?? false);
  const [updatingPublic, setUpdatingPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [savedSchoolName, setSavedSchoolName] = useState<string>('');
  const [schoolEntryId, setSchoolEntryId] = useState<string | null>(null);
  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const { mutate } = useSWRConfig();

  const [avatarUrl, setAvatarUrl] = useState<string>(
    initialUser?.profile_image_url || sessionUser.image || ''
  );
  const [bannerUrl, setBannerUrl] = useState<string>(initialUser?.banner_image_url || '/profile-banner2.png');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const schoolSectionRef = useRef<HTMLDivElement>(null);
  const connectedToastShownRef = useRef(false);

  useEffect(() => {
    const loadSchoolOptions = async () => {
      if (!isEditing || schoolOptions.length > 0) return;
      try {
        const data = await import('@/School.json');
        const names = (data.default || [])
          .map((s: any) => s?.name)
          .filter((n: any): n is string => typeof n === 'string' && n.trim().length > 0);
        setSchoolOptions(Array.from(new Set(names)));
      } catch (error) {
        console.error('Failed to load school list:', error);
      }
    };
    loadSchoolOptions();
  }, [isEditing, schoolOptions.length]);

  const { data: educationData, isLoading: educationLoading } = useSWR(
    sessionUser?.id ? `/api/db/user/education?user_id=${sessionUser.id}` : null
  );

  useEffect(() => {
    if (!sessionUser?.id) {
      setSchoolLoading(false);
      return;
    }
    if (educationLoading) return;
    const list = Array.isArray(educationData?.data) ? educationData.data : [];
    const current =
      list.find((e: any) => e?.is_current && e?.school_type === 'high_school')
      || list.find((e: any) => e?.school_type === 'high_school')
      || list[0];
    if (current?.school_name) {
      setSchoolName(current.school_name);
      setSavedSchoolName(current.school_name);
      setSchoolEntryId(current.id || null);
    }
    setSchoolLoading(false);
  }, [sessionUser?.id, educationLoading, educationData]);

  useEffect(() => {
    if (!connectedToastShownRef.current && searchParams.get('connected') === 'discord') {
      connectedToastShownRef.current = true;
      showToast.success('เชื่อมต่อ Discord แล้ว');
    }
  }, [searchParams]);

  const openCrop = (file: File, type: 'avatar' | 'banner') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropSrc(e.target?.result as string);
      setCropType(type);
    };
    reader.readAsDataURL(file);
  };

  const handleCropDone = async (blob: Blob) => {
    setCropSrc(null);
    const type = cropType;
    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingBanner;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', blob, `${type}.jpg`);
      const res = await fetch(`/api/profile/upload?type=${type}`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      const { url } = await res.json();
      if (type === 'avatar') setAvatarUrl(url);
      else setBannerUrl(url);
      showToast.success(type === 'avatar' ? 'อัปเดตรูปโปรไฟล์แล้ว' : 'อัปเดต banner แล้ว');
    } catch (e: any) {
      showToast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setUsernameError('');
    setSaving(true);
    try {
      const res = await fetch('/api/db/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: sessionUser.id,
          first_name: editedUser.first_name,
          last_name: editedUser.last_name,
          bio: editedUser.bio,
          username: editedUser.username || null,
        }),
      });

      if (res.status === 409) {
        setUsernameError('Username นี้ถูกใช้แล้ว');
        return;
      }
      if (!res.ok) throw new Error('Failed to update');

      setUserData({ ...userData, ...editedUser });
      setIsEditing(false);
      showToast.success(t('profileUpdated'));

      if (schoolName && schoolName.trim()) {
        try {
          const payload = {
            school_name: schoolName.trim(),
            school_type: 'high_school',
            is_current: true,
          };
          const eduRes = await fetch('/api/db/user/education', {
            method: schoolEntryId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(
              schoolEntryId ? { id: schoolEntryId, ...payload } : payload
            ),
          });
          if (eduRes.ok) {
            const eduData = await eduRes.json();
            if (eduData?.data?.id) {
              setSchoolEntryId(eduData.data.id);
            }
            setSavedSchoolName(schoolName.trim());
            mutate(`/api/db/user/education?user_id=${sessionUser.id}`);
          }
        } catch (err) {
          console.error('Failed to save school:', err);
        }
      }
    } catch {
      showToast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublic = async () => {
    setUpdatingPublic(true);
    const newValue = !isPublic;
    try {
      const res = await fetch('/api/db/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: sessionUser.id, is_public: newValue }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setIsPublic(newValue);
      setUserData({ ...userData, is_public: newValue });
      showToast.success(
        newValue ? t('publicProfileEnabled') : t('publicProfileDisabled'),
        { duration: 2000 }
      );
    } catch {
      showToast.error(t('cannotUpdateStatus'), { duration: 3000 });
    } finally {
      setUpdatingPublic(false);
    }
  };

  const handleCopyProfileLink = () => {
    const profileUrl = `${window.location.origin}/u/${userData?.username || sessionUser.id}`;
    navigator.clipboard.writeText(profileUrl);
    showToast.success(t('publicProfileLinkCopied'), { duration: 2000 });
  };

  return (
    <>
      {/* Crop Modal */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          type={cropType}
          onCancel={() => setCropSrc(null)}
          onCrop={handleCropDone}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md">

          {/* Banner */}
          <div
            className="relative aspect-[4/1] group cursor-pointer overflow-hidden rounded-t-xl"
            onClick={() => bannerInputRef.current?.click()}
          >
            {bannerUrl ? (
              <Image src={bannerUrl} alt="Banner" fill className="object-cover object-center" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-pink-600 via-pink-500 to-rose-500" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200">
              <span className="opacity-0 group-hover:opacity-100 flex items-center gap-2 text-white text-sm font-medium bg-black/50 rounded-full px-4 py-2 transition-opacity">
                <Camera className="w-4 h-4" />
                {uploadingBanner ? 'กำลังอัปโหลด...' : 'เปลี่ยน Banner'}
              </span>
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) openCrop(f, 'banner');
                e.target.value = '';
              }}
            />
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4 w-32">
              <div
                className="relative w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg group cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-200">
                  {uploadingAvatar ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) openCrop(f, 'avatar');
                  e.target.value = '';
                }}
              />
            </div>

            {/* Name + Edit button */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {userData?.first_name || userData?.last_name
                    ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
                    : sessionUser.name || t('basicProfile.unnamed')}
                </h2>
                {userData?.username && (
                  <p className="text-gray-400 text-sm flex items-center gap-1 mt-0.5">
                    <AtSign className="w-3.5 h-3.5" />
                    {userData.username}
                  </p>
                )}
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {sessionUser.email}
                </p>
                {schoolName && (
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <School className="w-4 h-4" />
                    {schoolName}
                  </p>
                )}
              </div>

              {!isEditing && (
                <div className="flex flex-col sm:flex-row gap-2">
                  {!schoolLoading && !schoolName && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setTimeout(() => schoolSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <School className="w-4 h-4" />
                      เพิ่มโรงเรียน
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    {t('editProfile')}
                  </button>
                </div>
              )}
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('firstName')}</label>
                    <input
                      type="text"
                      value={editedUser.first_name}
                      onChange={(e) => setEditedUser({ ...editedUser, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder={t('basicProfile.firstNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('lastName')}</label>
                    <input
                      type="text"
                      value={editedUser.last_name}
                      onChange={(e) => setEditedUser({ ...editedUser, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder={t('basicProfile.lastNamePlaceholder')}
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={editedUser.username}
                      onChange={(e) => {
                        setUsernameError('');
                        setEditedUser({
                          ...editedUser,
                          username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''),
                        });
                      }}
                      className={`w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                        usernameError ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="your_username"
                      maxLength={50}
                    />
                  </div>
                  {usernameError && <p className="text-xs text-red-500 mt-1">{usernameError}</p>}
                  <p className="text-xs text-gray-400 mt-1">ใช้ได้เฉพาะ a-z, 0-9, _ และ .</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('aboutMe')}</label>
                  <textarea
                    value={editedUser.bio}
                    onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder={t('basicProfile.bioPlaceholder')}
                  />
                </div>

                <div ref={schoolSectionRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">โรงเรียน</label>
                  <div className="flex gap-2">
                    <SearchSelect
                      value={schoolName}
                      onChange={setSchoolName}
                      options={schoolOptions}
                      placeholder="เลือกโรงเรียน"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    เลือกจากรายการโรงเรียน (ค้นหาชื่อได้)
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:bg-pink-300"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? tCommon('loading') : tCommon('save')}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setUsernameError('');
                      setSchoolName(savedSchoolName);
                      setEditedUser({
                        first_name: userData?.first_name || '',
                        last_name: userData?.last_name || '',
                        bio: userData?.bio || '',
                        username: userData?.username || '',
                      });
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100"
                  >
                    {tCommon('cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* Bio Display */}
            {!isEditing && userData?.bio && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{userData.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Public Profile Settings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-pink-600" />
            {t('publicProfile')}
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {isPublic
                  ? t('basicProfile.publicProfileEnabled')
                  : t('basicProfile.publicProfileDisabled')}
              </p>
              {isPublic && (
                <button
                  onClick={handleCopyProfileLink}
                  className="text-sm text-pink-600 hover:text-pink-700 underline"
                >
                  {t('basicProfile.copyProfileLink')}
                </button>
              )}
            </div>
            <button
              onClick={handleTogglePublic}
              disabled={updatingPublic}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? 'bg-pink-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('basicProfile.connectedAccounts')}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {t('basicProfile.connectSocialPrompt')}
          </p>

          <div className="space-y-3">
            {/* Google */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center">
                <Image
                  src="/icons/google-logo.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Google</p>
                  <p className="text-xs text-gray-500">
                    {connectedProviders.google ? sessionUser.email : t('basicProfile.notConnected')}
                  </p>
                </div>
              </div>
              {connectedProviders.google ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  {t('basicProfile.connected')}
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {t('basicProfile.notConnected')}
                </span>
              )}
            </div>

            {/* Discord */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[#5865F2] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.128 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Discord</p>
                  <p className="text-xs text-gray-500">
                    {connectedProviders.discord ? t('basicProfile.connected') : t('basicProfile.notConnected')}
                  </p>
                </div>
              </div>
              {connectedProviders.discord ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  {t('basicProfile.connected')}
                </span>
              ) : (
                <button
                  onClick={() => {
                    window.location.href = '/api/auth/discord/connect';
                  }}
                  className="text-sm text-white bg-[#5865F2] hover:bg-[#4752C4] px-3 py-1 rounded transition-colors"
                >
                  {t('basicProfile.connect')}
                </button>
              )}
            </div>

            {/* Instagram - Coming Soon */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Instagram</p>
                  <p className="text-xs text-gray-500">{t('basicProfile.notConnected')}</p>
                </div>
              </div>
              <button disabled className="text-sm text-gray-400 px-3 py-1 border border-gray-200 rounded cursor-not-allowed">
                {t('basicProfile.comingSoon')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
