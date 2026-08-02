import { describe, expect, it } from "vitest";
import {
  discoverLocalNetworkAddresses,
  type NetworkInterfaceMap,
} from "../src/network-address.js";

const entry = (
  address: string,
  options: { family?: string | number; internal?: boolean } = {},
) => ({
  address,
  family: options.family ?? "IPv4",
  internal: options.internal ?? false,
});

describe("local network address discovery", () => {
  it("excludes loopback and internal interface entries", () => {
    const interfaces: NetworkInterfaceMap = {
      Loopback: [entry("127.0.0.1")],
      Internal: [entry("192.168.1.4", { internal: true })],
    };

    expect(discoverLocalNetworkAddresses(interfaces)).toEqual([]);
  });

  it("accepts common private IPv4 ranges", () => {
    const interfaces: NetworkInterfaceMap = {
      Ethernet: [entry("10.0.0.15"), entry("172.20.4.9")],
      Wireless: [entry("192.168.1.24")],
    };

    expect(discoverLocalNetworkAddresses(interfaces)).toEqual([
      { address: "192.168.1.24", isPrivate: true },
      { address: "10.0.0.15", isPrivate: true },
      { address: "172.20.4.9", isPrivate: true },
    ]);
  });

  it("removes duplicate addresses and sorts deterministically", () => {
    const first: NetworkInterfaceMap = {
      AdapterB: [entry("8.8.8.8"), entry("10.0.0.12")],
      AdapterA: [entry("192.168.2.20"), entry("10.0.0.12")],
    };
    const second: NetworkInterfaceMap = {
      AdapterA: [...(first.AdapterA ?? [])].reverse(),
      AdapterB: [...(first.AdapterB ?? [])].reverse(),
    };

    const expected = [
      { address: "192.168.2.20", isPrivate: true },
      { address: "10.0.0.12", isPrivate: true },
      { address: "8.8.8.8", isPrivate: false },
    ];
    expect(discoverLocalNetworkAddresses(first)).toEqual(expected);
    expect(discoverLocalNetworkAddresses(second)).toEqual(expected);
  });

  it("excludes unusable, link-local, malformed, and non-IPv4 entries", () => {
    const interfaces: NetworkInterfaceMap = {
      Mixed: [
        entry("0.0.0.0"),
        entry("169.254.10.8"),
        entry("100.64.1.2"),
        entry("192.0.2.8"),
        entry("198.51.100.8"),
        entry("203.0.113.8"),
        entry("224.0.0.1"),
        entry("999.2.3.4"),
        entry("fe80::1", { family: "IPv6" }),
      ],
    };

    expect(discoverLocalNetworkAddresses(interfaces)).toEqual([]);
  });

  it("handles missing and disconnected interface entries safely", () => {
    expect(
      discoverLocalNetworkAddresses({ Ethernet: undefined, Wireless: [] }),
    ).toEqual([]);
  });
});
