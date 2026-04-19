import { useGetDiscover, getGetDiscoverQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Loader2, Heart } from "lucide-react";

export default function Discover() {
  const { data, isLoading } = useGetDiscover({
    query: {
      queryKey: getGetDiscoverQueryKey(),
    }
  });

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pt-6 md:pt-12 px-4 md:px-6 pb-24">
        <header className="mb-12">
          <h1 className="font-serif text-4xl mb-3 tracking-wide">Exhibition</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">Curated works from the community</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.posts || data.posts.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-muted-foreground">Nothing to discover yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 auto-rows-[200px] md:auto-rows-[300px]">
            {data.posts.map((post, i) => (
              <Link 
                key={post.id} 
                href={`/post/${post.id}`}
                className={`relative group overflow-hidden bg-muted/20 ${i % 5 === 0 ? "row-span-2 col-span-2 md:col-span-1" : ""}`}
              >
                <img 
                  src={post.imageUrl} 
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <h3 className="text-white font-serif text-lg leading-tight mb-1 truncate">{post.title}</h3>
                  <div className="flex items-center justify-between text-white/80 text-sm">
                    <span className="truncate pr-4">{post.user.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Heart className="w-3.5 h-3.5 fill-white text-white" />
                      <span className="font-mono text-xs">{post.likesCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
