import { avatarGradient, initialsOf } from '../../utils/format.js';

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

// Anonymous avatar — derived purely from the public anonymous name, never a
// real photo or identity.
export default function Avatar({ name = '?', size = 'md', online }) {
  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={`inline-flex items-center justify-center rounded-full font-display font-bold
          text-white bg-gradient-to-br ${avatarGradient(name)} ${sizes[size] || sizes.md}`}
        aria-hidden="true"
      >
        {initialsOf(name)}
      </div>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white
            ${online ? 'bg-green-400' : 'bg-lavender-200'}`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
