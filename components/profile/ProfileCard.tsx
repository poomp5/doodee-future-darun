"use client";

import { useState, ReactNode } from "react";
import { Edit, Check, Eye, EyeOff, Share2, ExternalLink, Star, Settings } from "lucide-react";
import Image from "next/image";
import R2Image from "@/components/R2Image";
import { Link } from "@/routing";
import { showToast } from "@/lib/toast";
import { useTranslations } from "next-intl";

interface ProfileCardProps {
  user: any;
  sessionUser: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  progressPercent: number;
  todoSection?: ReactNode;
}

export default function ProfileCard({ user: initialUser, sessionUser, progressPercent, todoSection }: ProfileCardProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

  const [userData, setUserData] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    first_name: initialUser?.first_name || "",
    last_name: initialUser?.last_name || "",
    bio: initialUser?.bio || "",
  });
  const [isPublic, setIsPublic] = useState(initialUser?.is_public ?? false);
  const [updatingPublic, setUpdatingPublic] = useState(false);

  const handleSaveClick = async () => {
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
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setUserData({ ...userData, ...editedUser });
      setIsEditing(false);

      showToast.success(t('profileUpdated'));
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast.error(t('saveError'));
    }
  };

  const handleViewPublicProfile = () => {
    window.open(`/u/${userData?.username || sessionUser.id}`, "_blank");
  };

  const handleCopyPublicProfileLink = () => {
    const profileUrl = `${window.location.origin}/u/${userData?.username || sessionUser.id}`;
    navigator.clipboard.writeText(profileUrl);
    showToast.success(t('publicProfileLinkCopied'), { duration: 2000 });
  };

  const handleTogglePublic = async () => {
    setUpdatingPublic(true);
    const newValue = !isPublic;

    try {
      const res = await fetch('/api/db/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: sessionUser.id,
          is_public: newValue,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setIsPublic(newValue);
      setUserData({ ...userData, is_public: newValue });

      showToast.success(
        newValue ? t('publicProfileEnabled') : t('publicProfileDisabled'),
        { duration: 2000 }
      );
    } catch (error) {
      console.error("Error updating public status:", error);
      showToast.error(t('cannotUpdateStatus'), { duration: 3000 });
    } finally {
      setUpdatingPublic(false);
    }
  };

  const displayName = userData?.first_name && userData?.last_name
    ? `${userData.first_name} ${userData.last_name}`
    : userData?.full_name || sessionUser.name || sessionUser.email?.split("@")[0];

  const profileImage = userData?.profile_image_url || sessionUser.image || "/profile.png";

  return (
    <div className="p-6 bg-white border border-gray-200 shadow-lg rounded-xl h-fit">
      <div className="flex flex-col items-center text-center">
        <div className="w-32 h-32 rounded-full mb-4 overflow-hidden border-4 border-pink-400">
          <R2Image
            src={profileImage}
            alt={displayName}
            width={300}
            height={300}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-full">
          {isEditing ? (
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={editedUser.first_name}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, first_name: e.target.value })
                }
                placeholder={t('firstName')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-300"
              />
              <input
                type="text"
                value={editedUser.last_name}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, last_name: e.target.value })
                }
                placeholder={t('lastName')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-300"
              />
              <textarea
                value={editedUser.bio}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, bio: e.target.value })
                }
                placeholder={t('aboutMe')}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-300"
              />
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-pink-700">
                {displayName}
              </h2>
              <p className="text-gray-700 mt-1">{sessionUser.email}</p>
              {userData?.bio && (
                <p className="text-gray-600 text-sm mt-2">{userData.bio}</p>
              )}
            </div>
          )}

          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={handleSaveClick}
                className="flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                {tCommon('save')}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center justify-center bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded w-full"
              >
                {tCommon('cancel')}
              </button>
            </div>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded shadow w-full mt-4"
          >
            <Edit className="h-5 w-5 mr-2" />
            {t('editProfile')}
          </button>
        )}

        {/* Public Profile Toggle */}
        <div className="w-full mt-3 flex items-center justify-between bg-gray-50 py-2 px-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-left">
            {isPublic ? (
              <Eye className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <EyeOff className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium text-gray-800">{t('publicProfile')}</span>
          </div>
          <button
            onClick={handleTogglePublic}
            disabled={updatingPublic}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              isPublic ? 'bg-green-500' : 'bg-gray-300'
            } ${updatingPublic ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {isPublic && (
          <div className="w-full mt-2 flex gap-2">
            <button
              onClick={handleCopyPublicProfileLink}
              className="flex-1 flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium py-2 px-3 rounded-md"
            >
              <Share2 className="h-4 w-4 mr-1" />
              {t('copyLink')}
            </button>
            <button
              onClick={handleViewPublicProfile}
              className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium py-2 px-3 rounded-md"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        )}
        <Link href="/points" className="w-full mt-2">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg flex items-center w-full justify-center">
            <Star className="h-4 w-4 mr-2" />
            {t('pointsSystem')}
          </button>
        </Link>

        {/* Mobile-only Admin Button */}
        {(userData?.role === 'admin' || userData?.role === 'superadmin' || userData?.role === 'moderator') && (
          <Link href="/admin" className="w-full mt-2 block md:hidden">
            <button className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-lg flex items-center w-full justify-center">
              <Settings className="h-4 w-4 mr-2" />
              {t('adminPanel')}
            </button>
          </Link>
        )}

        {/* Todo Section */}
        {todoSection}

        {/* Portfolio Progress */}
        <div className="w-full mt-4">
          <label className="block text-sm text-gray-700 mb-1">
            {t('portfolioProgress')}
          </label>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1 text-right">
            {progressPercent}%
          </p>
        </div>
      </div>
    </div>
  );
}
