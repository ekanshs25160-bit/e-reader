import { getInitials, THEME_OPTIONS } from '../lib/settings-helpers';
import Segmented from '@/components/ui/Segmented';
import Button from '@/components/ui/Button';

export function ProfileThemeSection({
  userName,
  userAvatar,
  editingName,
  setEditingName,
  nameInput,
  setNameInput,
  handleSaveName,
  avatarInputRef,
  handleAvatarFileSelected,
  handleRemoveAvatar,
  themeMode,
  setThemeMode,
  showToast,
}) {
  return (
    <section className="space-y-2">
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block px-1">
        READER PROFILE &amp; THEME
      </span>
      <div className="border border-hairline bg-surface rounded-[12px] divide-y divide-hairline">
        {/* Display Name Row */}
        <div
          onClick={() => {
            setNameInput(userName);
            setEditingName(true);
          }}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-hairline/10 transition-colors"
        >
          <span className="font-sans text-[14.5px] text-ink">Reader name</span>
          {editingName ? (
            <form
              onSubmit={handleSaveName}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2"
            >
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                placeholder="Reader"
                className="w-32 px-3 py-1.5 rounded-[8px] bg-background border border-hairline text-sm text-ink focus:outline-none focus:border-ink"
              />
              <Button type="submit" variant="primary" size="sm">
                Save
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 text-muted">
              <span className="font-sans text-[14px] text-ink">{userName || 'Reader'}</span>
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              >
                chevron_right
              </span>
            </div>
          )}
        </div>

        {/* Avatar Row */}
        <div className="flex items-center justify-between p-4">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileSelected}
          />
          <div
            onClick={() => avatarInputRef.current?.click()}
            className="flex-1 flex flex-col cursor-pointer"
          >
            <span className="font-sans text-[14.5px] text-ink">Profile monogram</span>
            <span className="text-[11.5px] text-muted font-sans">
              Stored locally on this device
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {userAvatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-[12px] text-muted hover:text-red-600 transition-colors px-2 py-1"
              >
                Remove
              </button>
            )}
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-10 h-10 rounded-full border border-hairline bg-surface text-ink flex items-center justify-center font-serif text-[15px] font-normal cursor-pointer overflow-hidden"
              title="Click to change avatar"
            >
              {userAvatar ? (
                <img
                  alt="Profile portrait"
                  className="w-full h-full object-cover"
                  src={userAvatar}
                />
              ) : (
                <span>{getInitials(userName)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Segmented Theme Control: 4 Palettes + Auto */}
        <div className="p-4 space-y-2">
          <span className="font-sans text-[14.5px] text-ink block">Theme Palette</span>
          <div className="pt-1">
            <Segmented
              options={THEME_OPTIONS}
              value={themeMode}
              onChange={(val) => {
                setThemeMode(val);
                showToast(`Theme set to ${val}`);
              }}
              fullWidth
            />
          </div>
        </div>
      </div>
    </section>
  );
}
