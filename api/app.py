from flask import Flask, request, jsonify, render_template
import yt_dlp

app = Flask(__name__, template_folder="../templates", static_folder="../static")

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/download", methods=["POST"])
def download():
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"message": "No URL provided"}), 400

    try:
        ydl_opts = {
            "quiet": True,
            "skip_download": True,   # IMPORTANT: only fetch info
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        # Basic info
        title = info.get("title")
        thumbnail = info.get("thumbnail")
        duration = info.get("duration")
        uploader = info.get("uploader")
        webpage_url = info.get("webpage_url")

        formats = info.get("formats", [])

        videos = []
        audios = []

        for f in formats:
            # Video formats (with video AND audio, ensuring 'mp4' has sound)
            if f.get("vcodec") != "none" and f.get("acodec") != "none":
                videos.append({
                    "quality": f.get("format_note") or f.get("height"),
                    "format_id": f.get("format_id"),
                    "ext": f.get("ext"),
                    "filesize": f.get("filesize"),
                    "url": f.get("url")
                })

            # Audio formats (audio only)
            if f.get("acodec") != "none" and f.get("vcodec") == "none":
                audios.append({
                    "quality": f.get("abr"),
                    "format_id": f.get("format_id"),
                    "ext": f.get("ext"),
                    "filesize": f.get("filesize"),
                    "url": f.get("url")
                })

        # Limit results and reverse to show highest quality first
        videos = videos[-5:][::-1]
        audios = audios[-5:][::-1]

        return jsonify({
            "title": title,
            "thumbnail": thumbnail,
            "duration": duration,
            "uploader": uploader,
            "videos": videos,
            "audios": audios,
            "platform": "YouTube"
        })

    except Exception as e:
        return jsonify({"message": str(e)}), 500


# Required for Vercel
app = app

if __name__ == '__main__':
    app.run(port=5000, debug=True)