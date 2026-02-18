export default function Editor() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold fs mb-6">Essay Editor</h1>
      <textarea className="w-full min-h-96 p-4 border border-[var(--bd)] rounded-lg" placeholder="Write your essay here..."></textarea>
      <button className="btnP mt-4">Submit Essay</button>
    </div>
  )
}
