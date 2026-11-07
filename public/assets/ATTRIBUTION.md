# Атрибуция медиа кинозоны

Материалы используются в соответствии с лицензией **Creative Commons Attribution 3.0**.

## Sintel

- Трейлер (исходник OGV): https://upload.wikimedia.org/wikipedia/commons/0/06/Sintel_trailer-1080p.ogv
- Локальные копии для веба: `trailers/sintel-480p.mp4`, `trailers/sintel-480p.webm` (≤720p)
- Постер: `posters/sintel.jpg` (Wikimedia Commons)
- © Blender Foundation / [sintel.org](https://durian.blender.org/) — CC BY 3.0

## Big Buck Bunny

- Трейлер (исходник OGV): https://upload.wikimedia.org/wikipedia/commons/1/18/Big_Buck_Bunny_Trailer_1080p.ogv
- Локальные копии: `trailers/big-buck-bunny-480p.mp4` (H.264/AAC из официального peach trailer_480p.mov через avconvert), `trailers/big-buck-bunny-480p.webm` (Wikimedia 480p VP9)
- Постер: `posters/big-buck-bunny.jpg` (Wikimedia Commons)
- © Blender Foundation / [bigbuckbunny.org](https://peach.blender.org/) — CC BY 3.0

## Примечание по кодированию

В среде сборки `ffmpeg` был недоступен. Вместо перекодирования исходных OGV используются уже оптимизированные производные ≤720p (MP4 H.264 от Blender / WebM VP9 от Wikimedia Commons). Неоптимизированные OGV в коммит не включены.
