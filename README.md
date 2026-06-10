# AI-Tech-Playground

[**AI 기초 체력 : IT 기술 사전**](https://github.com/TnStory/AI-Tech-Playbook) 책의 **인터랙티브 예제 모음**입니다.
책이 "읽고 이해하는 곳(Playbook)"이라면, 여기는 "직접 만져보는 곳(Playground)"입니다.

- 모두 **정적 페이지**(빌드·서버·API 키 불필요) → **GitHub Pages**로 바로 동작.
- 지도는 **Leaflet + CARTO Positron 타일**(밝은 회색 베이스맵, 키 불필요)을 사용합니다.

## 예제

| 예제 | 설명 | 라이브 |
|---|---|---|
| `geohash-explorer/` | 지도 위에 GeoHash 셀(레벨 6·7·8)을 겹쳐 그리고, 커서 셀 실시간 해시·레벨 토글·셀 클릭(자식 32 + 이웃 8)·검색·내 위치·공유 딥링크까지 직접 만져보는 데모. | [열기](https://tnstory.github.io/AI-Tech-Playground/geohash-explorer/) |

## 로컬에서 보기

정적 파일이라 그냥 브라우저로 열어도 되지만, 일부 브라우저의 보안 정책 때문에 간단한 로컬 서버 권장:

```bash
python3 -m http.server 8000
# http://localhost:8000/geohash-explorer/
```

## 라이선스 / 출처

지도 타일 © OpenStreetMap contributors (ODbL) · © CARTO. 가벼운 데모 용도.
