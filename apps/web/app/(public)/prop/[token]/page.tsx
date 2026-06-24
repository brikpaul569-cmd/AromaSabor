export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold">Proposal</h1>
      <p className="mt-2 text-gray-400">Plate Builder will render here</p>
    </div>
  );
}
