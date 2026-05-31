---
title: "Hello World 鈥?闆舵垚鏈崥瀹㈠惎鑸?
excerpt: "绗竴绡囧崥瀹㈡枃绔狅紝浠嬬粛杩欎釜闆舵垚鏈崥瀹㈢殑鎶€鏈爤鍜屾惌寤烘€濊矾銆?
publishedAt: 2026-05-31
tags: ["Astro", "GitHub Pages", "闆舵垚鏈?]
author: "RSY"
---

# Hello World 鈥?闆舵垚鏈崥瀹㈠惎鑸?

娆㈣繋鏉ュ埌鎴戠殑涓汉鍗氬锛佽繖鏄涓€绡囩ず渚嬫枃绔犮€?

## 涓轰粈涔堥€夋嫨闆舵垚鏈灦鏋勶紵

浣滀负鐙珛寮€鍙戣€咃紝鎴戝笇鏈涘湪 **瀹屽叏涓嶈姳閽?* 鐨勫墠鎻愪笅鎷ユ湁涓€涓珮鎬ц兘銆佸彲鎵╁睍鐨勪釜浜哄崥瀹€傜粡杩囪皟鐮旓紝鎴戦€夋嫨浜嗕互涓嬫妧鏈粍鍚堬細

| 灞傜骇 | 鎶€鏈?| 璐圭敤 |
|------|------|------|
| 闈欐€佺敓鎴?| Astro SSG | 鍏嶈垂 |
| 鏍峰紡 | TailwindCSS + Shadcn UI | 鍏嶈垂 |
| 璁よ瘉 | Supabase Auth | 鍏嶈垂 (50K MAU) |
| 鍥剧墖瀛樺偍 | Cloudflare R2 | 鍏嶈垂 (10GB) |
| 鎵樼 | GitHub Pages | 鍏嶈垂 (鏃犻檺甯﹀) |
| 璇勮 | Giscus | 鍏嶈垂 (GitHub Discussions) |
| 鍒嗘瀽 | GitHub Traffic | 鍏嶈垂 |

## 鎶€鏈寒鐐?

### 1. Astro 闈欐€佺敓鎴?

```astro
---
// src/pages/index.astro
const posts = await getCollection('blog');
---

<ul>
  {posts.map(post => <li>{post.data.title}</li>)}
</ul>
```

Astro 鍦ㄦ瀯寤烘椂灏嗛〉闈㈤娓叉煋涓虹函 HTML锛?*闆?JavaScript 寮€閿€**锛岄灞忓姞杞芥瀬蹇€?

### 2. 娣辫壊涓婚 路 绉戞妧椋?

浣跨敤 TailwindCSS v4 鐨?CSS 鍙橀噺绯荤粺锛岄厤鍚?Shadcn UI 缁勪欢搴擄紝瀹炵幇浜嗭細

- 榛樿娣辫壊涓婚锛屾姢鐪间笖閰风偒
- CSS 鍙橀噺椹卞姩锛屼竴閿垏鎹㈡祬鑹叉ā寮?
- 鍝佺墝鑹叉笎鍙樼偣缂€锛岀鎶€鎰熷崄瓒?

### 3. 閮ㄧ讲娴佺▼

```bash
# 鍐欐枃绔?鈫?鎺ㄩ€?鈫?鑷姩閮ㄧ讲
git add src/content/blog/new-post.md
git commit -m "鏂版枃绔? xxx"
git push origin master
# GitHub Pages 鑷姩鏋勫缓骞堕儴缃?
```

## 寮€濮嬪啓浣?

鍦?`src/content/blog/` 鐩綍涓嬪垱寤?`.md` 鏂囦欢锛?

```markdown
---
title: "浣犵殑鏂囩珷鏍囬"
excerpt: "鏂囩珷鎽樿"
publishedAt: 2026-06-01
tags: ["鏍囩1", "鏍囩2"]
---

鏂囩珷鍐呭...
```

鎺ㄩ€佸悗鍗冲彲鍦ㄩ椤电湅鍒版柊鏂囩珷銆?

---

> 杩欐槸绗竴绡囩ず渚嬫枃绔犮€傚悗缁細鍒嗕韩鏇村鍏ㄦ爤寮€鍙戙€佷簯璁＄畻鍜屽畨鍏ㄦ妧鏈浉鍏冲唴瀹广€?
