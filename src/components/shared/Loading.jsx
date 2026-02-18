export default function Loading({ fullPage = false, message = 'Loading...' }) {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-[var(--bd)]"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--ac)] animate-spin"></div>
      </div>
      <p className="text-[var(--mu)]">{message}</p>
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-[var(--bg)] flex items-center justify-center">
        {content}
      </div>
    )
  }

  return (
    <div className="w-full py-12 flex items-center justify-center">
      {content}
    </div>
  )
}
