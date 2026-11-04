import { Link } from 'react-router';

export default function NotFound() {
  return (
    <article className="markdown">
      <h1>Page Not Found</h1>
      <p>お探しのページは見つかりませんでした。<Link to="/">トップへ戻る</Link></p>
    </article>
  );
}
