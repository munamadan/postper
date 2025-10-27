# POSTPER

Execute HTTP requests directly from `.http` files in Visual Studio Code. A lightweight, text-based alternative to Postman with support for environment variables, request chaining, and file uploads.

## ✨ Features

- 📝 **Text-based HTTP requests** - Write requests in simple `.http` files
- 🔗 **Request chaining** - Use responses from previous requests
- 🌍 **Environment variables** - Switch between dev/prod/test environments
- 📤 **File uploads** - Support for multipart/form-data
- 🎨 **Syntax highlighting** - Beautiful HTTP syntax coloring
- 💾 **Version control friendly** - Plain text files work with Git
- 🚀 **Fast and lightweight** - No heavy GUI, just your editor

## 📦 Installation

1. Open VS Code
2. Press `Ctrl+P` (or `Cmd+P` on Mac)
3. Type: `ext install dipankharel.postper`
4. Press Enter

Or search for "POSTPER" in the Extensions view (`Ctrl+Shift+X`).

## 📝 Examples

Check out the `examples/` folder in the [GitHub repository](https://github.com/dipankharel/postper) for more examples:

- REST API CRUD operations
- Authentication flows
- File uploads
- GraphQL queries
- WebSocket connections (coming soon)

## 🐛 Known Limitations

- Headers with hyphens in chain variables (use simple names)
- Binary file downloads (text responses only)
- WebSocket support (planned for v2.0)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built using TypeScript and VS Code Extension API

## 📞 Support

- 🐛 **Report bugs:** [GitHub Issues](https://github.com/dipankharel/postper/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/dipankharel/postper/discussions)
- ⭐ **Star on GitHub:** [github.com/dipankharel/postper](https://github.com/dipankharel/postper)

---

**Made by Dipan Kharel**
\`\`\`

---

\`\`\`
MIT License

Copyright (c) 2025 Dipan Kharel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
\`\`\`

---
