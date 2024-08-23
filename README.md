# Pink Arrows: An Open-Source Web-Based Skitch Alternative
Pink Arrows is a lightweight, web-based annotation tool. Hosted version at [pinkarrows.app](https://pinkarrows.app) with no installation required.

Download size is ~500kb, and everything runs locally with no internet required. Nothing is stored server-side. It heavily uses [Fabric JS](http://fabricjs.com/)

![Pink Arrows in Action](assets/readme_gif.gif)

I really loved Skitch. In fact, the pink Skitch arrows and dumbed-down text became a trademark of mine in multiple jobs. In a sea of text on Slack and email, Skitch annotations are a refreshing way to make a single, obvious, and easy to digest point. Since Skitch shut down, I've looked for multiple alternatives that are: Free-ish, have similar styling, and are lightweight (no signin, no server syncing). I didn't find any, and that's how Pink Arrows was born.

## Contributing
Easiest way to contribute is to toss ideas and features in Github Issues.

If you'd like to contribute with code: 

1. Clone the repository:
```bash
git clone https://github.com/robbalian/pinkarrows.git
```

2. Run a simple http server:
```bash
cd pink-arrows
python3 -m http.server
```

3. Open your browser and go to http://localhost:8000 to start using Pink Arrows locally

## Roadmap / feature requests
- [ ] Hotkey tooltips
- [ ] Improve arrow dragging
- [ ] Line feature (not an arrow, just a line)
