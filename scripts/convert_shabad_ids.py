"""
Convert shabadIDs in data.csv from allShabads.js local IDs to DB IDs.

For rows WITH shabadID:
  - Get content verses from allShabads.js (skip raag headers)
  - Search DB for matching GurmukhiUni to find DB ShabadID
  - Match description to best verse within that shabad for verseID

For rows WITHOUT shabadID:
  - Search DB by description (transliteration) to find verseID/shabadID

Outputs: converted_data.csv with corrected shabadID, verseID, matched_verse columns.
"""

import csv
import json
import re
import mysql.connector
from difflib import SequenceMatcher
from pathlib import Path

ASSETS = Path(__file__).resolve().parent.parent / "assets"
CSV_PATH = ASSETS / "data.csv"
SHABADS_JS_PATH = ASSETS / "allShabads.js"
OUTPUT_PATH = ASSETS / "converted_data.csv"

# allShabads.js lines are in triplets: [gurmukhi, transliteration, english, ...]
TRIPLET_SIZE = 3


# --- Parse allShabads.js ---

def load_all_shabads(path: Path) -> dict:
    """Parse allShabads.js into {shabadID_str: [verse_lines...]}."""
    text = path.read_text(encoding="utf-8")
    text = text.replace("const ALL_SHABADS = ", "", 1)
    text = text.replace("module.exports = ALL_SHABADS", "")
    text = text.strip().rstrip(";").strip()
    return json.loads(text)


def get_content_gurmukhi_lines(shabad_lines: list) -> list[str]:
    """Return all Gurmukhi content lines (every 3rd starting at 0), skipping raag headers."""
    lines = []
    for i in range(0, len(shabad_lines), TRIPLET_SIZE):
        line = shabad_lines[i].strip()
        # Skip raag/section headers (e.g. "ਗਉੜੀ ਮਹਲਾ ੫ ਮਾਝ ॥")
        if is_raag_header(line):
            continue
        lines.append(line)
    return lines


def get_transliteration_lines(shabad_lines: list) -> list[str]:
    """Return all transliteration lines (every 3rd starting at 1)."""
    lines = []
    for i in range(1, len(shabad_lines), TRIPLET_SIZE):
        lines.append(shabad_lines[i].strip())
    return lines


RAAG_HEADER_RE = re.compile(
    r"^(ੴ\s+ਸਤਿ|ਸਲੋਕ|ਪਉੜੀ|ਛੰਤ|ਮਹਲਾ|ਰਾਗ|ਗਉੜੀ|ਆਸਾ|ਗੂਜਰੀ|ਸੂਹੀ|ਬਿਲਾਵਲੁ|ਸਿਰੀਰਾਗੁ|ਮਾਝ|ਵਡਹੰਸੁ|ਸੋਰਠਿ|ਧਨਾਸਰੀ|ਜੈਤਸਰੀ|ਟੋਡੀ|ਤਿਲੰਗ|ਸੂਹੀ|ਬਿਹਾਗੜਾ|ਮਾਰੂ|ਤੁਖਾਰੀ|ਕੇਦਾਰਾ|ਭੈਰਉ|ਬਸੰਤੁ|ਸਾਰਗ|ਮਲਾਰ|ਕਾਨੜਾ|ਕਲਿਆਣ|ਪ੍ਰਭਾਤੀ|ਜੈਜਾਵੰਤੀ|ਰਾਮਕਲੀ|ਨਟ|ਗੋਂਡ|ਦੇਵਗੰਧਾਰੀ|ਵਾਰ)"
)


def is_raag_header(line: str) -> bool:
    """Check if a Gurmukhi line is a raag/section header rather than content."""
    if not line:
        return True
    # Short lines ending with ॥ that match raag patterns
    if RAAG_HEADER_RE.search(line) and len(line) < 80:
        # Additional check: content verses are usually longer or have different structure
        # Headers typically don't have verse numbering like ॥੧॥
        if re.search(r"॥\d+॥", line):
            return False
        return True
    return False


# --- Gurmukhi detection ---

GURMUKHI_RE = re.compile(r"[\u0A00-\u0A7F]{3,}")


def extract_gurmukhi_from_desc(desc: str) -> str | None:
    if not desc:
        return None
    matches = GURMUKHI_RE.findall(desc)
    if matches:
        return max(matches, key=len)
    return None


# --- String similarity ---

def normalize_translit(text: str) -> str:
    """Normalize transliteration for comparison."""
    text = re.sub(r"\(.*?\)", "", text)  # remove parentheticals
    text = text.lower()
    text = re.sub(r"[^a-z\s]", "", text)  # keep only letters and spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


# --- DB lookup ---

def connect_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        database="banidb",
    )


def find_verse_by_gurmukhi(cursor, gurmukhi_text: str) -> tuple | None:
    """Search Verse for matching GurmukhiUni. Returns (VerseID, GurmukhiUni) or None."""
    cursor.execute(
        "SELECT ID, GurmukhiUni FROM Verse WHERE GurmukhiUni = %s LIMIT 1",
        (gurmukhi_text,),
    )
    row = cursor.fetchone()
    if row:
        return row

    cursor.execute(
        "SELECT ID, GurmukhiUni FROM Verse WHERE GurmukhiUni LIKE %s LIMIT 1",
        (f"%{gurmukhi_text}%",),
    )
    return cursor.fetchone()


def get_shabad_id_for_verse(cursor, verse_id: int) -> int | None:
    cursor.execute(
        "SELECT ShabadID FROM Shabad WHERE VerseID = %s LIMIT 1",
        (verse_id,),
    )
    row = cursor.fetchone()
    return row[0] if row else None


def get_shabad_verses(cursor, shabad_id: int) -> list[dict]:
    """Get all verses in a shabad with their transliterations."""
    cursor.execute(
        """SELECT v.ID, v.GurmukhiUni, v.Transliterations, v.English
        FROM Verse v
        INNER JOIN Shabad sh ON v.ID = sh.VerseID
        WHERE sh.ShabadID = %s
        ORDER BY v.ID""",
        (shabad_id,),
    )
    rows = cursor.fetchall()
    verses = []
    for vid, guni, translits_json, english in rows:
        translit_en = ""
        if translits_json:
            try:
                t = json.loads(translits_json)
                translit_en = t.get("en", "")
            except (json.JSONDecodeError, TypeError):
                pass
        verses.append({
            "id": vid,
            "gurmukhi": guni or "",
            "translit": translit_en,
            "english": english or "",
        })
    return verses


def find_best_verse_for_desc(verses: list[dict], desc: str) -> dict | None:
    """Find which verse in a shabad best matches the description text."""
    if not verses or not desc:
        return None

    norm_desc = normalize_translit(desc)
    if len(norm_desc) < 3:
        return None

    best = None
    best_score = 0.0

    for v in verses:
        # Skip header verses
        if is_raag_header(v["gurmukhi"]):
            continue

        norm_translit = normalize_translit(v["translit"])
        # Compare description against transliteration
        score = similarity(norm_desc, norm_translit)

        # Also try substring match: if desc words appear in translit
        desc_words = norm_desc.split()
        if desc_words:
            word_hits = sum(1 for w in desc_words if w in norm_translit)
            word_score = word_hits / len(desc_words)
            score = max(score, word_score)

        if score > best_score:
            best_score = score
            best = v

    # Require minimum similarity
    if best and best_score >= 0.25:
        return best
    return None


def find_verse_by_transliteration(cursor, text: str) -> tuple | None:
    """Search DB using English transliteration from description."""
    clean = re.sub(r"\(.*?\)", "", text).strip().rstrip(",").strip()
    if len(clean) < 5:
        return None

    first_phrase = re.split(r"\band\b|,", clean)[0].strip()
    if len(first_phrase) < 5:
        return None

    # Use word-boundary-ish search: add spaces around to avoid partial word matches
    cursor.execute(
        "SELECT ID, GurmukhiUni FROM Verse WHERE Transliterations LIKE %s LIMIT 1",
        (f"%{first_phrase}%",),
    )
    return cursor.fetchone()


# --- Main ---

def main():
    print("Loading allShabads.js...")
    all_shabads = load_all_shabads(SHABADS_JS_PATH)
    print(f"Loaded {len(all_shabads)} shabads from JS.")

    print("Connecting to DB...")
    conn = connect_db()
    cursor = conn.cursor()

    rows = []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        for row in reader:
            rows.append(row)

    # Insert verseID right after shabadID in field order
    shabad_idx = fieldnames.index("shabadID")
    out_fields = fieldnames[:shabad_idx + 1] + ["verseID"] + fieldnames[shabad_idx + 1:] + ["matched_verse"]

    matched = 0
    total = len(rows)

    for i, row in enumerate(rows):
        old_id = row.get("shabadID", "").strip()
        desc = row.get("description", "").strip()
        db_shabad_id = ""
        db_verse_id = ""
        matched_verse = ""

        # --- Strategy 1: Has shabadID in allShabads.js ---
        if old_id and old_id in all_shabads:
            shabad_lines = all_shabads[old_id]
            content_lines = get_content_gurmukhi_lines(shabad_lines)

            # Find DB ShabadID by matching any content verse
            found_db_shabad = None
            for gurmukhi_line in content_lines[:3]:  # try first 3 content lines
                result = find_verse_by_gurmukhi(cursor, gurmukhi_line)
                if result:
                    vid, _ = result
                    sid = get_shabad_id_for_verse(cursor, vid)
                    if sid is not None:
                        found_db_shabad = sid
                        break

            if found_db_shabad:
                db_shabad_id = str(found_db_shabad)
                # Now find best matching verse for verseID from description
                shabad_verses = get_shabad_verses(cursor, found_db_shabad)
                best = find_best_verse_for_desc(shabad_verses, desc)
                if best:
                    db_verse_id = str(best["id"])
                    matched_verse = best["gurmukhi"]
                else:
                    # Fallback: use first non-header verse
                    for v in shabad_verses:
                        if not is_raag_header(v["gurmukhi"]):
                            db_verse_id = str(v["id"])
                            matched_verse = v["gurmukhi"]
                            break
                matched += 1

        # --- Strategy 2: No shabadID or not in allShabads -> search by description ---
        if not db_shabad_id:
            verse_result = None

            # Try Gurmukhi in description
            gurmukhi_desc = extract_gurmukhi_from_desc(desc)
            if gurmukhi_desc:
                verse_result = find_verse_by_gurmukhi(cursor, gurmukhi_desc)

            # Try transliteration search
            if not verse_result and desc:
                verse_result = find_verse_by_transliteration(cursor, desc)

            if verse_result:
                vid, guni = verse_result
                sid = get_shabad_id_for_verse(cursor, vid)
                if sid is not None:
                    db_shabad_id = str(sid)
                    db_verse_id = str(vid)
                    matched_verse = guni or ""
                    matched += 1

        row["shabadID"] = db_shabad_id
        row["verseID"] = db_verse_id
        row["matched_verse"] = matched_verse

        if (i + 1) % 100 == 0:
            print(f"Processed {i + 1}/{total}...")

    cursor.close()
    conn.close()

    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=out_fields)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDone. {matched}/{total} rows matched a DB ShabadID.")
    print(f"Output: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
