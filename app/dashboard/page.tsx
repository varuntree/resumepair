export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://resumepair.com/docs/tutorials/private-page
export default async function Dashboard() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <div className="bg-background p-6 rounded-lg shadow-md border border-border">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">Welcome to Dashboard</h1>
          <p className="text-muted-foreground">You are successfully logged in. This is your private dashboard area.</p>
        </div>
      </section>
    </main>
  );
}
