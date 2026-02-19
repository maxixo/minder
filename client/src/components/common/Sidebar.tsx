// Placeholder  implement navigation sidebar here
// Links: / (Home), /reflection, /selfcare, /emotional, /review, /analytics, /settings
export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-sage-100 shadow-soft p-6">
      <div className="text-2xl font-display font-semibold text-sage-700 mb-8">🌿 Mindful</div>
      <nav className="flex-1 space-y-1">
        {/* Add NavLink items here */}
      </nav>
    </aside>
  );
}
