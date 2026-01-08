export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex-1 p-8 bg-gray-900 min-h-screen text-white">
            {children}
        </div>
    )
}
