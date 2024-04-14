export default function PostWithId({ params }: { params: { postId: string } }) {
  const { postId } = params;
  return (
    <div>
      <h1>This is a post with an id!</h1>
      This is the postid: {postId}
    </div>
  );
}
