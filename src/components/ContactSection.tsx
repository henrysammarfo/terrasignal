import { Mail, Twitter, Github, Linkedin } from "lucide-react";

const socials = [
  { icon: Twitter, href: "https://twitter.com/henrysammarfo", label: "Twitter" },
  { icon: Github, href: "https://github.com/henrysammarfo", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/in/henrysammarfo", label: "LinkedIn" },
];

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 px-6 bg-muted/30">
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-8">
        <h2 className="text-3xl sm:text-4xl font-bold font-['Geist'] tracking-tight text-foreground">
          Get in Touch
        </h2>
        <p className="text-muted-foreground text-[15px] font-['Geist'] leading-relaxed max-w-md">
          Have questions about TerraSignal or want to partner with us? Reach out directly.
        </p>

        <a
          href="mailto:henrysammarfo@gmail.com"
          className="inline-flex items-center gap-2.5 bg-foreground text-background px-6 py-3 rounded-full text-[14px] font-medium font-['Geist'] hover:opacity-90 transition-opacity"
        >
          <Mail className="w-4 h-4" />
          henrysammarfo@gmail.com
        </a>

        <div className="flex items-center gap-4 pt-2">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              <s.icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
