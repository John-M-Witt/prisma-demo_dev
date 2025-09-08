-- @param {String} $1:searchText
-- @param {Int} $2:limit

SELECT id, content, created_at  
FROM posts
WHERE content % $1
ORDER BY similarity("content", $1) DESC 
LIMIT $2